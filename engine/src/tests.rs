use super::*;

fn advance(g: &mut Game, seconds: f64, fps: u32) {
    let mut left = seconds;
    while left > 1e-8 { let dt = left.min(1.0 / fps as f64); g.step(dt as f32); left -= dt; }
}
fn perfect(g: &mut Game) {
    assert!(g.set_pressure(0));
    let time = g.target * g.capacity / g.flow();
    assert!(g.begin_pour()); advance(g, time, 120); g.end_pour();
    if !g.hardcore { assert!(g.serve()); }
    assert_eq!(g.stars, 5, "soda={} cup={} target={} score={}", g.soda, g.cup, g.target, g.accuracy);
}
fn finish(g: &mut Game) {
    while g.phase != 2 { if g.phase == 0 { perfect(g); } g.next_order(); }
}
fn wealthy(g: &mut Game, cents: u32) { g.cash = cents; g.lifetime_gross = cents; g.refresh(); }
fn next(g: &mut Game) {
    g.next_order(); if g.phase == 2 { let seed = g.day + 91; assert!(g.next_day(seed)); }
}

#[test]
fn defaults_and_input_guards() {
    let mut g = Game::new(3);
    assert_eq!(&g.state()[0..6], &[0.0, 1.0, 0.0, 0.0, 0.65, 280.0]);
    assert!(g.hardcore); assert_eq!((g.cash, g.day, g.goal, g.pressure), (0, 1, 12, 1));
    assert_eq!(g.rating, 3.5); assert!(!g.serve()); assert!(!g.set_pressure(3));
    assert!(g.begin_pour()); assert!(!g.begin_pour()); assert!(!g.serve());
    assert!(!g.set_mode(false)); assert!(!g.set_pressure(0));
    advance(&mut g, 1.75, 120); g.end_pour(); assert_eq!(g.stars, 5);
    let paid = g.save(); assert!(!g.begin_pour()); assert!(!g.serve()); g.end_pour();
    assert_eq!(g.save(), paid); assert_eq!(g.completed, 1);
}

#[test]
fn zero_duration_consumes_attempt_but_generates_no_sale() {
    let mut g = Game::new(1); assert!(g.begin_pour()); g.end_pour();
    assert_eq!((g.phase, g.stars, g.completed, g.payout, g.cash), (1, 1, 1, 0, 0));
    assert_eq!((g.last_ingredient, g.last_cleanup, g.last_net), (0, 0, 0));
    assert!(g.last_refund > 0); assert!(!g.begin_pour());
}

#[test]
fn easy_topups_remain_possible_but_pressure_locks() {
    let mut g = Game::new(9); assert!(g.set_mode(false));
    for _ in 0..2 {
        assert!(g.begin_pour()); advance(&mut g, 0.875, 60); g.end_pour();
        assert_eq!(g.phase, 0); assert!(!g.set_pressure(0));
        advance(&mut g, 0.3, 60);
    }
    assert!(g.serve()); assert_eq!(g.stars, 5); assert!(!g.serve());
}

#[test]
fn service_clock_starts_on_attempt_and_freezes_after_commit() {
    let mut g = Game::new(1); advance(&mut g, 30.0, 60);
    assert_eq!(g.elapsed, 0.0); assert_eq!(g.patience(), 1.0);
    perfect(&mut g); let paid = g.save();
    let foam = g.foam; advance(&mut g, 20.0, 60);
    assert!(foam > 0.0); assert_eq!(g.foam, 0.0);
    let settled = g.save(); for i in 0..SAVE_LEN { if i == 6 { assert!((settled[i] - paid[i]).abs() < 1e-7); } else { assert_eq!(settled[i], paid[i]); } }
}

#[test]
fn all_336_soda_cup_target_tap_requests_admit_a_gentle_five_star_hold() {
    let mut count = 0;
    for tap in 0..=2 { for soda in 0..4 { for cup in 0..4 {
        for target in [0.45, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80] {
            let mut g = Game::new(1); g.soda = soda; g.cup = cup;
            g.capacity = CAPACITIES[cup]; g.target = target; g.upgrades[3] = tap;
            perfect(&mut g); assert!(g.accuracy > 99.99); assert_eq!(g.beverage_waste, 0.0);
            assert!(g.foam > 1.0, "gentle pressure must still produce visible fizz");
            assert!(g.elapsed < g.patience_limit()); count += 1;
        }
    }}}
    assert_eq!(count, 336);
}

#[test]
fn both_modes_share_all_pressure_physics_and_final_fill_score() {
    for pressure in 0..3 { for soda in 0..4 { for cup in 0..4 { for tap in 0..=2 {
        for seconds in [0.8, 2.5] {
            let mut hard = Game::new(1); hard.soda = soda; hard.cup = cup;
            hard.capacity = CAPACITIES[cup]; hard.upgrades[3] = tap; hard.pressure = pressure;
            let mut easy = hard.clone(); easy.set_mode(false);
            hard.begin_pour(); easy.begin_pour(); advance(&mut hard, seconds, 60); advance(&mut easy, seconds, 60);
            assert_eq!((hard.liquid, hard.foam, hard.foam_liquid, hard.spill, hard.beverage_waste),
                (easy.liquid, easy.foam, easy.foam_liquid, easy.spill, easy.beverage_waste));
            hard.end_pour(); easy.end_pour(); advance(&mut hard, 0.5, 60); advance(&mut easy, 0.5, 60);
            assert_eq!((hard.liquid, hard.foam, hard.foam_liquid), (easy.liquid, easy.foam, easy.foam_liquid));
            easy.serve(); assert!((hard.accuracy - easy.accuracy).abs() < 1e-6); assert_eq!(hard.stars, easy.stars);
        }
    }}}}
}

#[test]
fn pressure_keeps_a_real_fizz_speed_and_mess_tradeoff() {
    let mut runs = Vec::new();
    for pressure in 0..3 {
        let mut g = Game::new(1); g.soda = 3; g.target = 0.8; g.set_pressure(pressure);
        let seconds = g.target * g.capacity / g.flow();
        g.begin_pour(); advance(&mut g, seconds, 120); g.end_pour(); runs.push(g);
    }
    assert!(runs[0].elapsed > runs[1].elapsed && runs[1].elapsed > runs[2].elapsed);
    assert!(runs[0].foam > 20.0);
    assert_eq!(runs[0].spill, 0.0); assert!(runs[1].spill > 50.0); assert!(runs[2].spill > runs[1].spill);
    assert!(runs[0].last_service_tip < runs[1].speed_tip());
    assert!(runs[1].beverage_waste < runs[1].spill / 4.0);
}

#[test]
fn waste_measures_actual_lost_beverage_and_score_excludes_gas() {
    let mut g = Game::new(1); g.soda = 3; g.target = 0.8; wealthy(&mut g, 10000);
    g.begin_pour(); advance(&mut g, 2.3, 120); g.end_pour();
    assert!(g.spill > 50.0); assert!(g.beverage_waste > 5.0);
    assert!((g.poured - g.beverage_ml() - g.beverage_waste).abs() < 1e-6);
    let expected = 100.0 - 350.0 * (g.beverage_ml() / g.capacity - g.target).abs();
    assert!((g.accuracy - expected).abs() < 1e-6);
    assert!(g.last_cleanup > 0); assert!(g.last_ingredient > 0);
    assert_eq!(g.cash as i64, 10000 + g.last_net);
}

#[test]
fn overfill_is_bounded_and_bad_pours_can_lose_real_cash_without_debt() {
    let mut g = Game::new(4); wealthy(&mut g, 1000);
    g.begin_pour(); advance(&mut g, 12.0, 60); g.end_pour();
    assert!(g.liquid + g.foam <= g.capacity + 1e-6);
    assert_eq!(g.stars, 1); assert_eq!(g.payout, 0); assert!(g.last_net < 0); assert!(g.cash < 1000);
    g.cash = 0; g.next_order(); g.begin_pour(); advance(&mut g, 12.0, 60); g.end_pour();
    assert_eq!(g.cash, 0); g.next_order(); perfect(&mut g); assert!(g.cash > 0);
}

#[test]
fn render_frame_rates_agree_and_invalid_steps_cannot_start_pour() {
    let mut runs = Vec::new();
    for fps in [30, 60, 120] {
        let mut g = Game::new(4);
        for dt in [f32::NAN, f32::INFINITY, -1.0, 0.0, 0.25] { g.step(dt); }
        assert_eq!(g.elapsed, 0.0); assert_eq!(g.liquid, 0.0);
        g.begin_pour(); advance(&mut g, 1.5, fps); runs.push(g);
    }
    for g in &runs[1..] { assert!((runs[0].liquid - g.liquid).abs() < 0.001); assert!((runs[0].foam - g.foam).abs() < 0.001); }
    let mut g = Game::new(1); g.begin_pour(); g.step(100.0); assert!((g.poured - 26.0).abs() < 1e-5);
}

#[test]
fn every_target_remains_generated_and_equipment_never_filters_requests() {
    let targets = [0.45, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80];
    let mut seen = [[[[false; 7]; 4]; 4]; 3];
    for tap in 0..=2 { for seed in 1..=64 {
        let mut g = Game::new(seed); g.upgrades[3] = tap;
        for day in 1..=2 {
            while g.phase != 2 {
                let t = targets.iter().position(|v| *v == g.target).unwrap();
                seen[tap as usize][g.soda][g.cup][t] = true;
                g.begin_pour(); g.end_pour(); g.next_order();
            }
            if day == 1 { g.next_day(seed + 7919); }
        }
    }}
    assert!(seen.iter().flatten().flatten().flatten().all(|v| *v));
    let mut games = Vec::new();
    for hard in [true, false] { for tap in 0..=2 { for p in 0..3 {
        let mut g = Game::new(777); g.set_mode(hard); g.upgrades[3] = tap; g.pressure = p; games.push(g);
    }}}
    for _ in 0..24 {
        let expected = (games[0].soda, games[0].cup, games[0].target);
        for g in &mut games {
            assert_eq!((g.soda, g.cup, g.target), expected);
            g.begin_pour(); g.end_pour(); if !g.hardcore { g.serve(); } next(g);
        }
    }
}

#[test]
fn long_streak_rewards_dominate_repeated_mode_resets() {
    let mut keep = Game::new(1); let mut reset = keep.clone();
    for n in 1..=40 {
        perfect(&mut keep); perfect(&mut reset);
        assert_eq!(keep.last_milestone, Game::milestone(n));
        next(&mut keep); next(&mut reset);
        if n % 8 == 0 { assert!(reset.set_mode(false)); assert!(reset.set_mode(true)); }
    }
    assert!(keep.cash > reset.cash, "long={} reset={}", keep.cash, reset.cash);
    assert_eq!(keep.combo(), 1.9); assert_eq!(keep.best_streak, 40); assert_eq!(keep.hard_best, 40);
    keep.begin_pour(); keep.end_pour(); assert_eq!(keep.streak, 0); assert_eq!(keep.combo(), 1.0);
}

#[test]
fn grades_use_unrounded_fill_and_each_mode_retains_its_best() {
    let mut g = Game::new(3); let t = (g.target - 0.02) * g.capacity / g.flow();
    g.begin_pour(); advance(&mut g, t, 120); g.end_pour(); assert_eq!((g.stars, g.streak), (4, 1));
    next(&mut g); g.set_mode(false); perfect(&mut g); next(&mut g); perfect(&mut g);
    assert_eq!((g.hard_best, g.easy_best), (1, 2));
    let cash = g.cash; g.set_mode(true); assert_eq!(g.streak, 0); assert_eq!(g.cash, cash);
}

#[test]
fn bad_reviews_reduce_future_prices_and_good_service_recovers() {
    let mut g = Game::new(1); g.begin_pour(); g.end_pour(); let low = g.rating;
    assert!(low < 3.5); g.next_order(); assert!(g.multiplier < 1.3);
    perfect(&mut g); assert!(g.rating > low);
}

#[test]
fn recipe_and_requested_quantity_have_real_menu_prices() {
    let mut g = Game::new(1); let orange = g.menu_price(); g.soda = 3;
    assert!(g.menu_price() > orange); let small = g.menu_price();
    g.cup = 2; g.capacity = CAPACITIES[2]; assert!(g.menu_price() > small);
    let lower = g.menu_price(); g.target = 0.8; assert!(g.menu_price() > lower);
}

#[test]
fn purchases_obey_cost_caps_prerequisites_and_attempt_locks() {
    let mut g = Game::new(1); assert!(!g.buy(0)); assert!(!g.buy(99)); wealthy(&mut g, 50000);
    assert!(!g.buy(7)); assert!(!g.buy(8)); let before = g.cash; let quoted = g.cost(0);
    assert!(g.buy(0)); assert_eq!(g.cash, before - quoted);
    assert!(g.buy(0)); assert!(g.buy(0)); assert!(!g.buy(0)); assert_eq!(g.cost(0), 0);
    g.begin_pour(); assert!(!g.buy(3)); g.end_pour(); assert!(g.buy(3));
}

#[test]
fn tap_reduces_gas_without_suppressing_fizz_or_losing_beverage() {
    let mut plain = Game::new(1); plain.soda = 3; let mut upgraded = plain.clone(); upgraded.upgrades[3] = 2;
    plain.begin_pour(); upgraded.begin_pour(); advance(&mut plain, 1.0, 120); advance(&mut upgraded, 1.0, 120);
    assert!(upgraded.foam < plain.foam * 0.7); assert!(upgraded.foam > 20.0);
    assert!((plain.beverage_ml() - upgraded.beverage_ml()).abs() < 1e-5);
}

#[test]
fn sign_awning_and_helper_have_independent_revenue_and_operating_effects() {
    let plain = Game::new(1); let mut improved = plain.clone(); wealthy(&mut improved, 10000);
    improved.buy(0); improved.buy(2); improved.active_helper = true; improved.upgrades[4] = 1;
    assert!(improved.patience_limit() > plain.patience_limit());
    let mut plain = plain; perfect(&mut plain); perfect(&mut improved);
    assert!(improved.last_base > plain.last_base); assert!(improved.last_service_tip >= plain.last_service_tip + 40);
    assert!(improved.shift_sign > 0); let receipt = improved.payout;
    assert!(improved.buy(0)); assert_eq!(improved.payout, receipt);
}

#[test]
fn helper_cuts_cleanup_time_and_cost() {
    let mut plain = Game::new(1); wealthy(&mut plain, 10000);
    let mut helper = plain.clone(); helper.active_helper = true; helper.upgrades[4] = 1;
    for g in [&mut plain, &mut helper] { g.begin_pour(); advance(g, 5.0, 120); g.end_pour(); }
    assert!((helper.cleanup_seconds * 2.0 - plain.cleanup_seconds).abs() < 1e-8);
    assert!(helper.last_cleanup < plain.last_cleanup); assert!(helper.cleanup_saved > 0.0);
}

#[test]
fn seats_add_staff_capacity_instead_of_extra_player_labor() {
    let mut g = Game::new(1); wealthy(&mut g, 20000); g.buy(1); g.buy(4); g.buy(5);
    assert_eq!(g.goal, 12); assert!(!g.active_helper && !g.active_specialist); finish(&mut g);
    g.next_day(22); assert_eq!(g.goal, 12); assert!(g.active_helper && g.active_specialist);
    assert_eq!(g.staff_capacity, 5); assert_eq!(g.queued_demand, 5); assert_eq!(g.wages_due(), 400);
}

#[test]
fn actual_staff_orders_and_full_net_ledger_reconcile_once() {
    let mut g = Game::new(1); wealthy(&mut g, 20000);
    g.buy(1); g.buy(4); g.buy(5); finish(&mut g); g.next_day(22); let opening = g.cash;
    perfect(&mut g); assert!(g.staff_orders <= 1); next(&mut g); perfect(&mut g);
    assert!(g.staff_orders > 0); assert!(g.staff_sales > 0); finish(&mut g);
    assert_eq!(g.wages_paid, 400); assert_eq!(g.staff_orders, 5);
    assert_eq!(g.cash, opening + g.shift_gross - g.shift_ingredients - g.shift_cleanup - g.wages_paid);
    assert_eq!(g.state()[59], (g.shift_gross as i64 - g.shift_ingredients as i64 - g.shift_cleanup as i64 - 400) as f32);
    let paid = g.save(); g.next_order(); g.end_pour(); g.serve(); g.step(0.25); assert_eq!(g.save(), paid);
}

#[test]
fn empty_orders_cannot_farm_staff_and_menus_cannot_advance_staff_work() {
    let mut g = Game::new(1); g.active_specialist = true; g.upgrades[5] = 1; g.staff_capacity = 3;
    for _ in 0..12 {
        advance(&mut g, 30.0, 60); assert_eq!(g.elapsed, 0.0);
        g.begin_pour(); g.end_pour(); g.next_order();
    }
    assert_eq!((g.staff_sales, g.staff_orders, g.cash), (0, 0, 0));
}

#[test]
fn expansions_and_training_change_real_capacity_demand_and_staff_yield() {
    let mut g = Game::new(1); wealthy(&mut g, 100000);
    for item in [5, 6, 7, 8] { assert!(g.buy(item)); }
    finish(&mut g); g.next_day(77);
    assert_eq!(g.staff_capacity, 9); assert_eq!(g.queued_demand, 14);
    finish(&mut g); assert!(g.staff_orders >= 8); assert!(g.staff_sales > 4000);
    assert!(g.missed_customers > 0); assert_eq!(g.upgrades[6..9], [1, 1, 1]);
}

#[test]
fn payroll_is_reserved_before_purchases_and_bad_pour_costs() {
    let mut g = Game::new(1); wealthy(&mut g, 1500);
    g.upgrades[4] = 1; g.upgrades[5] = 1; g.active_helper = true; g.active_specialist = true;
    assert_eq!(g.spendable(), 1100); assert!(!g.buy(0)); g.cash = 450;
    g.begin_pour(); advance(&mut g, 10.0, 120); g.end_pour(); assert_eq!(g.cash, 400);
}

#[test]
fn late_service_loses_speed_tip_and_demand_without_changing_fill_score() {
    let mut fast = Game::new(1); fast.set_mode(false); let mut slow = fast.clone();
    for g in [&mut fast, &mut slow] { g.begin_pour(); advance(g, 1.75, 120); g.end_pour(); }
    advance(&mut slow, 12.0, 60); fast.serve(); slow.serve();
    assert_eq!(fast.stars, slow.stars); assert!(fast.last_service_tip > slow.last_service_tip);
    assert!(fast.last_base > slow.last_base); assert_eq!(slow.missed_customers, 1);
}

#[test]
fn v102_paid_save_is_exact_and_cannot_replay_payout() {
    let mut g = Game::new(1); perfect(&mut g); let s = g.save(); assert_eq!(s[0], 102.0);
    let mut restored = Game::restore(&s).unwrap(); assert_eq!(restored.save(), s); assert_eq!(restored.foam, 0.0);
    let cash = restored.cash; restored.end_pour(); assert!(!restored.serve()); assert!(!restored.begin_pour());
    advance(&mut restored, 8.0, 60); assert_eq!(restored.cash, cash); assert_eq!(restored.save(), s);
}

#[test]
fn interrupted_hardcore_save_commits_remaining_drink_once() {
    let mut g = Game::new(1); g.begin_pour(); advance(&mut g, 1.0, 120);
    let s = g.save(); assert!(s[6] > 0.0 && s[7] > 0.0 && s[8] > 0.0);
    let mut restored = Game::restore(&s).unwrap();
    assert_eq!((restored.phase, restored.completed), (1, 1)); assert!(!restored.holding);
    assert!(!restored.begin_pour()); assert!(!restored.serve());
    let committed = restored.save(); assert_eq!(Game::restore(&committed).unwrap().save(), committed);
}

#[test]
fn interrupted_easy_restores_stopped_and_can_finish_its_existing_cup() {
    let mut g = Game::new(1); g.set_mode(false); g.begin_pour(); advance(&mut g, 0.8, 120);
    let mut r = Game::restore(&g.save()).unwrap(); assert!(!r.hardcore && !r.holding && r.attempted);
    assert_eq!(r.completed, 0); assert!(r.begin_pour()); advance(&mut r, 0.95, 120); r.end_pour();
    assert!(r.serve()); assert_eq!(r.stars, 5);
}

#[test]
fn saved_easy_result_defaults_to_hardcore_but_keeps_its_record() {
    let mut g = Game::new(1); g.set_mode(false); perfect(&mut g);
    let r = Game::restore(&g.save()).unwrap(); assert!(r.hardcore);
    assert_eq!((r.streak, r.best_streak, r.easy_best), (0, 1, 1)); assert_eq!(r.cash, g.cash);
}

#[test]
fn invalid_saves_fail_without_panics() {
    let valid = Game::new(1).save();
    for (index, value) in [(0, 100.0), (1, 8.0), (3, 4.0), (10, f64::NAN),
        (20, 0.0), (21, -1.0), (21, 1.0), (25, 1.5), (26, 13.0), (28, 9.0),
        (34, 4.0), (44, 1.0), (119, 1.0), (6, f64::INFINITY), (53, 3.0), (66, 1.0), (54, 100.0)] {
        let mut bad = valid; bad[index] = value;
        assert!(Game::restore(&bad).is_none(), "index={index} value={value}");
    }
    assert!(Game::restore(&valid).is_some());
}

#[test]
fn full_business_roundtrip_preserves_large_cents_and_operating_ledger() {
    let mut g = Game::new(1); wealthy(&mut g, 100_000_001);
    for item in 0..9 { while g.cost(item) > 0 { assert!(g.buy(item)); } }
    finish(&mut g); g.next_day(55); finish(&mut g);
    let saved = g.save(); let r = Game::restore(&saved).unwrap(); assert_eq!(r.save(), saved);
    assert_eq!(r.cash, g.cash); assert_eq!(r.wages_paid, 400); assert_eq!(r.upgrades, UPGRADE_MAX);
}
