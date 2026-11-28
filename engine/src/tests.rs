use super::*;

// Existing physics/business regressions select the requested recipe before a
// first hold. Recipe-specific tests below call the public input methods directly.
impl Game {
    fn begin_ready(&mut self) -> bool {
        if self.phase == 0 && !self.attempted {
            assert!(self.set_recipe(self.soda, self.ordered_cherries, self.ordered_lime, self.ordered_syrup, self.ordered_blend));
        }
        self.begin_pour()
    }
}


fn advance(g: &mut Game, seconds: f64, fps: u32) {
    let mut left = seconds;
    while left > 1e-8 { let dt = left.min(1.0 / fps as f64); g.step(dt as f32); left -= dt; }
}
fn perfect(g: &mut Game) {
    assert!(g.set_pressure(0));
    for _ in 0..if g.is_mix() { 2 } else { 1 } {
        let time = (g.active_target() * g.capacity - g.beverage_ml()) / g.flow();
        assert!(g.begin_ready()); advance(g, time, 120); g.end_pour();
        if !g.hardcore { assert!(g.serve()); }
    }
    assert_eq!(g.stars, 5, "soda={} cup={} target={} score={}", g.soda, g.cup, g.target, g.accuracy);
}
fn empty_pour(g: &mut Game) {
    for _ in 0..if g.is_mix() { 2 } else { 1 } {
        assert!(g.begin_ready()); g.end_pour(); if !g.hardcore { assert!(g.serve()); }
    }
    assert_eq!(g.phase, 1);
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
    assert!(g.begin_ready()); assert!(!g.begin_ready()); assert!(!g.serve());
    assert!(!g.set_mode(false)); assert!(!g.set_pressure(0));
    advance(&mut g, 1.75, 120); g.end_pour(); assert_eq!(g.stars, 5);
    let paid = g.save(); assert!(!g.begin_ready()); assert!(!g.serve()); g.end_pour();
    assert_eq!(g.save(), paid); assert_eq!(g.completed, 1);
}

#[test]
fn zero_duration_consumes_attempt_but_generates_no_sale() {
    let mut g = Game::new(1); assert!(g.begin_ready()); g.end_pour();
    assert_eq!((g.phase, g.stars, g.completed, g.payout, g.cash), (1, 1, 1, 0, 0));
    assert_eq!((g.last_ingredient, g.last_cleanup, g.last_net), (0, 0, 0));
    assert!(g.last_refund > 0); assert!(!g.begin_ready());
}

#[test]
fn easy_topups_remain_possible_but_pressure_locks() {
    let mut g = Game::new(9); assert!(g.set_mode(false));
    for _ in 0..2 {
        assert!(g.begin_ready()); advance(&mut g, 0.875, 60); g.end_pour();
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
            hard.begin_ready(); easy.begin_ready(); advance(&mut hard, seconds, 60); advance(&mut easy, seconds, 60);
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
        g.begin_ready(); advance(&mut g, seconds, 120); g.end_pour(); runs.push(g);
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
    g.begin_ready(); advance(&mut g, 2.3, 120); g.end_pour();
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
    g.begin_ready(); advance(&mut g, 12.0, 60); g.end_pour();
    assert!(g.liquid + g.foam <= g.capacity + 1e-6);
    assert_eq!(g.stars, 1); assert_eq!(g.payout, 0); assert!(g.last_net < 0); assert!(g.cash < 1000);
    g.cash = 0; g.next_order(); g.begin_ready(); advance(&mut g, 12.0, 60); g.end_pour();
    assert_eq!(g.cash, 0); g.next_order(); perfect(&mut g); assert!(g.cash > 0);
}

#[test]
fn render_frame_rates_agree_and_invalid_steps_cannot_start_pour() {
    let mut runs = Vec::new();
    for fps in [30, 60, 120] {
        let mut g = Game::new(4);
        for dt in [f32::NAN, f32::INFINITY, -1.0, 0.0, 0.25] { g.step(dt); }
        assert_eq!(g.elapsed, 0.0); assert_eq!(g.liquid, 0.0);
        g.begin_ready(); advance(&mut g, 1.5, fps); runs.push(g);
    }
    for g in &runs[1..] { assert!((runs[0].liquid - g.liquid).abs() < 0.001); assert!((runs[0].foam - g.foam).abs() < 0.001); }
    let mut g = Game::new(1); g.begin_ready(); g.step(100.0); assert!((g.poured - 26.0).abs() < 1e-5);
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
                empty_pour(&mut g); g.next_order();
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
            empty_pour(g); next(g);
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
    empty_pour(&mut keep); assert_eq!(keep.streak, 0); assert_eq!(keep.combo(), 1.0);
}

#[test]
fn grades_use_unrounded_fill_and_each_mode_retains_its_best() {
    let mut g = Game::new(3); let t = (g.target - 0.02) * g.capacity / g.flow();
    g.begin_ready(); advance(&mut g, t, 120); g.end_pour(); assert_eq!((g.stars, g.streak), (4, 1));
    next(&mut g); g.set_mode(false); perfect(&mut g); next(&mut g); perfect(&mut g);
    assert_eq!((g.hard_best, g.easy_best), (1, 2));
    let cash = g.cash; g.set_mode(true); assert_eq!(g.streak, 0); assert_eq!(g.cash, cash);
}

#[test]
fn bad_reviews_reduce_future_prices_and_good_service_recovers() {
    let mut g = Game::new(1); g.begin_ready(); g.end_pour(); let low = g.rating;
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
    g.begin_ready(); assert!(!g.buy(3)); g.end_pour(); assert!(g.buy(3));
}

#[test]
fn tap_reduces_gas_without_suppressing_fizz_or_losing_beverage() {
    let mut plain = Game::new(1); plain.soda = 3; let mut upgraded = plain.clone(); upgraded.upgrades[3] = 2;
    plain.begin_ready(); upgraded.begin_ready(); advance(&mut plain, 1.0, 120); advance(&mut upgraded, 1.0, 120);
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
    for g in [&mut plain, &mut helper] { g.begin_ready(); advance(g, 5.0, 120); g.end_pour(); }
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
        empty_pour(&mut g); g.next_order();
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
    g.begin_ready(); advance(&mut g, 10.0, 120); g.end_pour(); assert_eq!(g.cash, 400);
}

#[test]
fn late_service_loses_speed_tip_and_demand_without_changing_fill_score() {
    let mut fast = Game::new(1); fast.set_mode(false); let mut slow = fast.clone();
    for g in [&mut fast, &mut slow] { g.begin_ready(); advance(g, 1.75, 120); g.end_pour(); }
    advance(&mut slow, 12.0, 60); fast.serve(); slow.serve();
    assert_eq!(fast.stars, slow.stars); assert!(fast.last_service_tip > slow.last_service_tip);
    assert!(fast.last_base > slow.last_base); assert_eq!(slow.missed_customers, 1);
}

#[test]
fn v104_paid_save_is_exact_and_cannot_replay_payout() {
    let mut g = Game::new(1); perfect(&mut g); let s = g.save(); assert_eq!(s[0], 106.0);
    let mut restored = Game::restore(&s).unwrap(); assert_eq!(restored.save(), s); assert_eq!(restored.foam, 0.0);
    let cash = restored.cash; restored.end_pour(); assert!(!restored.serve()); assert!(!restored.begin_ready());
    advance(&mut restored, 8.0, 60); assert_eq!(restored.cash, cash); assert_eq!(restored.save(), s);
}

#[test]
fn interrupted_hardcore_save_commits_remaining_drink_once() {
    let mut g = Game::new(1); g.begin_ready(); advance(&mut g, 1.0, 120);
    let s = g.save(); assert!(s[6] > 0.0 && s[7] > 0.0 && s[8] > 0.0);
    let mut restored = Game::restore(&s).unwrap();
    assert_eq!((restored.phase, restored.completed), (1, 1)); assert!(!restored.holding);
    assert!(!restored.begin_ready()); assert!(!restored.serve());
    let committed = restored.save(); assert_eq!(Game::restore(&committed).unwrap().save(), committed);
}

#[test]
fn interrupted_easy_restores_stopped_and_can_finish_its_existing_cup() {
    let mut g = Game::new(1); g.set_mode(false); g.begin_ready(); advance(&mut g, 0.8, 120);
    let mut r = Game::restore(&g.save()).unwrap(); assert!(!r.hardcore && !r.holding && r.attempted);
    assert_eq!(r.completed, 0); assert!(r.begin_ready()); advance(&mut r, 0.95, 120); r.end_pour();
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
    for item in 0..12 { while g.cost(item) > 0 { assert!(g.buy(item)); } }
    finish(&mut g); g.next_day(55); finish(&mut g);
    let saved = g.save(); let r = Game::restore(&saved).unwrap(); assert_eq!(r.save(), saved);
    assert_eq!(r.cash, g.cash); assert_eq!(r.wages_paid, 400); assert_eq!(r.upgrades, UPGRADE_MAX);
}

#[test]
fn fresh_recipe_requires_a_base_and_locks_atomically_on_first_hold() {
    for hardcore in [true, false] {
        let mut g = Game::new(314); g.set_mode(hardcore);
        assert_eq!((g.ordered_cherries, g.selected_soda), (1, 4));
        assert!(!g.begin_pour()); assert!(!g.attempted);
        for invalid in [(5, 0, 0, 0, 1), (0, 6, 0, 0, 1), (0, 0, 1, 0, 1), (0, 0, 0, 1, 1), (0, 0, 0, 0, 0)] {
            let before = g.save(); assert!(!g.set_recipe(invalid.0, invalid.1, invalid.2, invalid.3, invalid.4));
            assert_eq!(g.save(), before);
        }
        assert!(g.set_recipe(4, 1, 0, 0, 1)); assert!(g.prep_started); assert!(!g.begin_pour());
        assert!(g.set_recipe(0, 1, 0, 0, 1)); assert!(g.begin_pour());
        assert_eq!((g.state()[108], g.state()[109]), (1.0, 0.0));
        let locked = g.save(); assert!(!g.set_recipe(3, 2, 0, 0, 1)); assert_eq!(g.save(), locked);
        advance(&mut g, 0.8, 120); g.end_pour();
        assert!(!g.set_recipe(0, 0, 0, 0, 1));
        if !hardcore { assert!(g.begin_pour()); advance(&mut g, 0.95, 120); g.end_pour(); assert!(g.serve()); }
    }
}

#[test]
fn recipe_grade_cannot_be_hidden_by_a_perfect_fill() {
    let mut wrong_base = Game::new(1); wrong_base.set_pressure(0);
    assert!(wrong_base.set_recipe(3, 1, 0, 0, 1));
    let time = wrong_base.target * wrong_base.capacity / wrong_base.flow();
    wrong_base.begin_pour(); advance(&mut wrong_base, time, 120); wrong_base.end_pour();
    assert!(wrong_base.accuracy > 99.99); assert_eq!(wrong_base.fill_stars(), 5);
    assert_eq!(wrong_base.recipe_accuracy(), 40); assert_eq!((wrong_base.stars, wrong_base.streak), (2, 0));
    assert_eq!(wrong_base.recipe_mistakes(), 1);
    let mut missing_cherry = Game::new(1); missing_cherry.set_pressure(0);
    missing_cherry.set_recipe(0, 0, 0, 0, 1); let time = missing_cherry.target * missing_cherry.capacity / missing_cherry.flow();
    missing_cherry.begin_pour(); advance(&mut missing_cherry, time, 120); missing_cherry.end_pour();
    assert!(missing_cherry.accuracy > 99.99); assert_eq!(missing_cherry.recipe_accuracy(), 85);
    assert_eq!((missing_cherry.stars, missing_cherry.recipe_mistakes()), (4, 2));
}

#[test]
fn garnish_cost_is_real_and_unrequested_extras_do_not_raise_the_quote() {
    let mut plain = Game::new(1); plain.ordered_cherries = 0; wealthy(&mut plain, 1000);
    let mut extra = plain.clone();
    plain.set_recipe(0, 0, 0, 0, 1); extra.set_recipe(0, 2, 0, 0, 1);
    assert_eq!(plain.menu_price(), extra.menu_price()); assert_eq!(extra.addin_cost(), 16);
    for g in [&mut plain, &mut extra] {
        g.set_pressure(0); let time = g.target * g.capacity / g.flow();
        g.begin_pour(); advance(g, time, 120); g.end_pour();
    }
    assert_eq!(extra.last_ingredient, plain.last_ingredient + 16);
    assert!(extra.last_base < plain.last_base); assert!(extra.cash < plain.cash);
    assert_eq!(extra.cash as i64, 1000 + extra.last_net);
}

#[test]
fn prep_clock_and_unpoured_recipe_survive_reload_without_spending_the_attempt() {
    let mut g = Game::new(71);
    assert!(g.set_recipe(4, 0, 0, 0, 1)); advance(&mut g, 3.0, 120); assert_eq!(g.elapsed, 0.0);
    g.set_recipe(4, 1, 0, 0, 1); advance(&mut g, 2.0, 120);
    assert!((g.elapsed - 2.0).abs() < 1e-6); assert_eq!(g.patience_limit(), 11.5);
    g.set_recipe(4, 0, 0, 0, 1); let saved = g.save();
    let mut r = Game::restore(&saved).unwrap(); assert_eq!(r.save(), saved);
    assert!(!r.attempted && r.prep_started); assert_eq!(r.phase, 0); assert_eq!(r.selected_soda, 4);
    assert!(!r.begin_pour()); r.set_recipe(0, 1, 0, 0, 1); assert!(r.begin_pour());
    advance(&mut r, 0.5, 120); r.end_pour(); assert_eq!(r.completed, 1);
    let paid_clock = r.elapsed; advance(&mut r, 10.0, 120); assert_eq!(r.elapsed, paid_clock);
}

#[test]
fn recipe_unlocks_cost_cash_and_do_not_change_an_existing_request() {
    let mut g = Game::new(1); wealthy(&mut g, 10000);
    let request = (g.soda, g.target, g.ordered_cherries, g.ordered_lime, g.ordered_syrup, g.ordered_blend);
    for (item, cost) in [(9, 1000), (10, 1800), (11, 2600)] {
        assert_eq!(g.cost(item), cost); let cash = g.cash; assert!(g.buy(item));
        assert_eq!(g.cash, cash - cost); assert_eq!(g.cost(item), 0); assert!(!g.buy(item));
        assert_eq!((g.soda, g.target, g.ordered_cherries, g.ordered_lime, g.ordered_syrup, g.ordered_blend), request);
    }
    assert!(g.set_recipe(0, 2, 1, 2, 0)); assert_eq!(g.addin_cost(), 50);
    assert_eq!(g.recipe_fizz(), 1.08); assert_eq!(g.state()[110..113], [1.0, 1.0, 1.0]);
}

#[test]
fn generated_recipes_use_owned_stations_at_most_two_addins_and_plain_breaks() {
    let mut seen = [false; 6];
    for mask in 0..8 {
        let mut g = Game::new(91 + mask);
        for item in 0..3 { g.upgrades[9 + item] = (mask >> item) & 1; }
        for _ in 0..240 {
            assert!(g.ordered_lime == 0 || g.upgrades[9] > 0);
            assert!(g.ordered_syrup == 0 || g.upgrades[10] > 0);
            assert!(g.ordered_blend == 1 || g.upgrades[11] > 0);
            let kinds = (g.ordered_cherries > 0) as u32 + (g.ordered_lime > 0) as u32 + (g.ordered_syrup > 0) as u32;
            assert!(kinds <= 2);
            if mask == 7 {
                seen[0] |= g.recipe_premium() == 0; seen[1] |= g.ordered_cherries == 2;
                seen[2] |= g.ordered_lime == 1; seen[3] |= g.ordered_syrup > 0;
                seen[4] |= g.ordered_blend == 0; seen[5] |= g.ordered_blend == 2;
            }
            perfect(&mut g); next(&mut g);
        }
    }
    assert!(seen.into_iter().all(|v| v));
}

#[test]
fn all_gentle_blends_keep_every_catalog_fill_reachable_with_foam() {
    let mut count = 0;
    for blend in 0..3 { for tap in 0..3 { for soda in 0..4 { for cup in 0..4 {
        for target in [0.45, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80] {
            let mut g = Game::new(1); g.soda = soda; g.cup = cup; g.capacity = CAPACITIES[cup];
            g.target = target; g.upgrades[3] = tap; g.upgrades[11] = 1; g.ordered_blend = blend;
            perfect(&mut g); assert!(g.accuracy > 99.99); assert_eq!(g.beverage_waste, 0.0);
            assert!(g.foam > 1.0); count += 1;
        }
    }}}}
    assert_eq!(count, 1008);
}

#[test]
fn custom_paid_and_interrupted_saves_preserve_recipe_and_payment_once() {
    let mut g = Game::new(11); wealthy(&mut g, 10000); for i in 9..12 { g.buy(i); }
    g.ordered_cherries = 2; g.ordered_lime = 1; g.ordered_blend = 0;
    g.set_recipe(0, 1, 1, 1, 0); g.begin_pour(); advance(&mut g, 0.7, 120);
    let mut r = Game::restore(&g.save()).unwrap();
    assert_eq!(r.phase, 1); assert_eq!((r.selected_cherries, r.selected_lime, r.selected_syrup, r.selected_blend), (1, 1, 1, 0));
    assert_eq!(r.completed, 1); assert_eq!(r.recipe_mistakes(), 10);
    let paid = r.save(); r.end_pour(); r.serve(); assert!(!r.set_recipe(0, 2, 1, 0, 0));
    assert_eq!(r.save(), paid); assert_eq!(Game::restore(&paid).unwrap().save(), paid);
}

#[test]
fn malformed_recipe_saves_are_rejected_including_unowned_ingredients() {
    let valid = Game::new(1).save();
    for (index, value) in [(83, 3.0), (84, 1.0), (85, 1.0), (86, 0.0), (87, 5.0),
        (88, 3.0), (89, 1.0), (90, 1.0), (91, 2.0), (92, 2.0), (93, 2.0), (96, 12.0), (97, 1.0)] {
        let mut bad = valid; bad[index] = value; assert!(Game::restore(&bad).is_none(), "{index}");
    }
    let mut g = Game::new(1); perfect(&mut g); let mut bad = g.save(); bad[88] = 0.0;
    assert!(Game::restore(&bad).is_none(), "paid grade must agree with locked recipe");
}

fn mixed(first: usize, second: usize, share: f64) -> Game {
    let mut g = Game::new(104);
    g.soda = first; g.second_soda = second; g.first_share = share;
    g.selected_soda = first; g.ordered_cherries = 0; g.prep_allowance = 4.0;
    g.refresh(); g
}

fn pour_part_ml(g: &mut Game, amount: f64) {
    assert!(g.begin_ready()); let time = amount / g.flow(); advance(g, time, 120);
    g.end_pour(); if !g.hardcore { assert!(g.serve()); }
}

#[test]
fn mixed_hardcore_uses_one_hold_per_soda_and_only_final_release_pays() {
    let mut g = mixed(0, 3, 0.5); wealthy(&mut g, 10000); g.set_pressure(0);
    let target = g.target * g.capacity;
    assert_eq!(g.active_target(), g.target * 0.5); assert!(g.begin_ready());
    assert!(!g.begin_pour()); advance(&mut g, target * 0.5 / (RATES[0] * 0.55), 120); g.end_pour();
    assert_eq!((g.phase, g.pour_part, g.attempted, g.part_attempted), (0, 1, true, false));
    assert_eq!((g.cash, g.completed, g.last_ingredient, g.staff_sales), (10000, 0, 0, 0));
    assert_eq!(g.actual_soda(), 3); assert_eq!(g.selected_soda, 0); assert_eq!(g.active_target(), g.target);
    let waiting = g.save(); g.end_pour(); assert_eq!(g.save(), waiting); assert!(!g.serve());
    assert!(!g.set_mode(false)); assert!(!g.set_pressure(2)); assert!(!g.set_recipe(3, 0, 0, 0, 1)); assert!(!g.buy(0));
    pour_part_ml(&mut g, target * 0.5);
    assert_eq!((g.phase, g.completed, g.stars), (1, 1, 5)); assert!(g.cash > 10000);
    let paid = g.save(); g.end_pour(); assert!(!g.begin_pour()); assert!(!g.serve()); assert_eq!(g.save(), paid);
}

#[test]
fn easy_mixed_parts_allow_topups_but_need_an_explicit_advance() {
    let mut g = mixed(1, 2, 0.5); g.set_mode(false); g.set_pressure(0);
    let quarter = g.target * g.capacity * 0.25;
    for _ in 0..2 {
        assert!(g.begin_ready()); let time = quarter / g.flow(); advance(&mut g, time, 120); g.end_pour();
        assert_eq!(g.pour_part, 0); assert_eq!(g.completed, 0); assert_eq!(g.cash, 0);
    }
    assert!(g.serve()); assert_eq!(g.pour_part, 1); assert!(!g.part_attempted); assert!(!g.serve());
    for _ in 0..2 {
        assert!(g.begin_pour()); let time = quarter / g.flow(); advance(&mut g, time, 120); g.end_pour();
        assert_eq!(g.phase, 0); assert_eq!(g.completed, 0);
    }
    assert!(g.serve()); assert_eq!((g.completed, g.stars), (1, 5)); assert!(!g.serve());
}

#[test]
fn all_gentle_two_soda_catalog_ratios_are_reachable_without_removing_fizz() {
    let mut cases = 0;
    for first in 0..4 { for second in 0..4 { if first == second { continue; }
        for share in [0.25, 0.5, 0.75] { for cup in 0..4 { for tap in 0..3 {
            for target in [0.45, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80] {
                let mut g = mixed(first, second, share); g.cup = cup; g.capacity = CAPACITIES[cup];
                g.target = target; g.upgrades[3] = tap; perfect(&mut g);
                assert!(g.accuracy > 99.99 && g.mix_accuracy() > 99.99);
                assert_eq!(g.beverage_waste, 0.0); assert!(g.foam > 1.0); cases += 1;
            }
        }}}
    }}
    assert_eq!(cases, 3024);
}

#[test]
fn mix_ratio_and_final_fill_are_separate_grades() {
    let mut g = mixed(0, 3, 0.5); g.set_pressure(0); let target = g.target * g.capacity;
    pour_part_ml(&mut g, target * 0.25); pour_part_ml(&mut g, target * 0.75);
    assert!(g.accuracy > 99.99); assert_eq!(g.fill_stars(), 5);
    assert!((g.mix_accuracy() - 50.0).abs() < 0.001); assert!(g.stars <= 2);
    for share in [0.25, 0.5, 0.75] {
        let mut empty = mixed(0, 1, share); empty_pour(&mut empty);
        assert_eq!(empty.mix_accuracy(), 0.0); assert_eq!(empty.payout, 0);
        let mut only_first = mixed(0, 1, share); only_first.set_pressure(0);
        let amount = only_first.target * only_first.capacity;
        pour_part_ml(&mut only_first, amount); pour_part_ml(&mut only_first, 0.0);
        assert!(only_first.accuracy > 99.99); assert!(only_first.mix_accuracy() <= 50.00001);
        assert!(only_first.stars < 5);
    }
}

#[test]
fn mixed_modes_share_physics_and_spills_remove_real_component_beverage() {
    for pressure in 0..3 {
        let mut hard = mixed(0, 3, 0.5); hard.set_pressure(pressure);
        let mut easy = hard.clone(); easy.set_mode(false);
        for seconds in [1.4, 4.0] {
            for g in [&mut hard, &mut easy] {
                assert!(g.begin_ready()); advance(g, seconds, 120); g.end_pour(); if !g.hardcore { assert!(g.serve()); }
            }
            assert_eq!((hard.liquid, hard.foam, hard.foam_liquid, hard.first_liquid, hard.first_foam, hard.first_foam_liquid),
                (easy.liquid, easy.foam, easy.foam_liquid, easy.first_liquid, easy.first_foam, easy.first_foam_liquid));
        }
        assert!(hard.spill > 0.0 && hard.beverage_waste > 0.0);
        assert!(hard.first_beverage_ml() < hard.first_poured);
        assert!((hard.poured - hard.beverage_ml() - hard.beverage_waste).abs() < 1e-6);
        assert!(hard.liquid + hard.foam <= hard.capacity + 1e-6);
        assert_eq!(hard.accuracy, easy.accuracy); assert_eq!(hard.mix_accuracy(), easy.mix_accuracy());
    }
}

#[test]
fn first_soda_keeps_its_own_settling_rate_after_tap_switch() {
    let mut g = mixed(0, 3, 0.5); g.begin_ready(); advance(&mut g, 0.5, 120); g.end_pour();
    assert_eq!(g.actual_soda(), 3); let foam = g.first_foam;
    let dt = 1.0 / 240.0; g.tick(dt, false);
    assert!((g.first_foam - foam * (1.0 - SETTLE_RATES[0] * dt)).abs() < 1e-10);
    assert!(g.first_foam > 0.0);
}

#[test]
fn mixed_receipt_costs_both_actual_sodas_once_and_freezes_after_payment() {
    let mut g = mixed(0, 3, 0.25); wealthy(&mut g, 10000); g.set_pressure(0);
    g.ordered_cherries = 1; let target = g.target * g.capacity;
    assert_eq!(g.menu_price(), (110.0 + target * (0.65 * 0.25 + 0.9 * 0.75)).round() as u32 + 60 + 40);
    pour_part_ml(&mut g, target * 0.25); assert_eq!(g.cash, 10000); assert_eq!(g.last_ingredient, 0);
    pour_part_ml(&mut g, target * 0.75);
    let expected = 8 + (15.0 + g.first_poured * 0.10 + (g.poured - g.first_poured) * 0.16).ceil() as u32;
    assert_eq!(g.last_ingredient, expected); assert_eq!(g.cash as i64, 10000 + g.last_net);
    let paid = g.save(); let grade = (g.mix_accuracy(), g.first_beverage_ml(), g.beverage_ml());
    advance(&mut g, 20.0, 120); assert_eq!(g.foam, 0.0);
    assert_eq!((g.mix_accuracy(), g.first_beverage_ml(), g.beverage_ml()), grade);
    assert_eq!(g.save(), paid); assert_eq!(Game::restore(&paid).unwrap().save(), paid);
}

#[test]
fn mixed_hardcore_restore_consumes_only_the_interrupted_part() {
    let mut g = mixed(0, 3, 0.5); g.set_pressure(0);
    let fresh = g.save(); assert_eq!(Game::restore(&fresh).unwrap().save(), fresh);
    assert!(g.begin_ready()); advance(&mut g, 0.5, 120);
    let mut r = Game::restore(&g.save()).unwrap();
    assert_eq!((r.phase, r.pour_part, r.part_attempted, r.completed, r.cash), (0, 1, false, 0, 0));
    let waiting = r.save();
    for _ in 0..3 { r = Game::restore(&r.save()).unwrap(); assert_eq!(r.save(), waiting); }
    assert!(r.begin_pour()); advance(&mut r, 0.5, 120);
    let mut paid = Game::restore(&r.save()).unwrap(); assert_eq!((paid.phase, paid.completed), (1, 1));
    let checkpoint = paid.save(); paid.end_pour(); assert!(!paid.begin_pour()); assert!(!paid.serve());
    assert_eq!(paid.save(), checkpoint); assert_eq!(Game::restore(&checkpoint).unwrap().save(), checkpoint);
    let mut empty = mixed(0, 1, 0.5); empty.begin_ready(); empty.end_pour();
    let mut second = Game::restore(&empty.save()).unwrap(); assert_eq!(second.pour_part, 1); assert!(!second.part_attempted);
    second.begin_pour(); second.end_pour(); assert_eq!((second.completed, second.payout), (1, 0));
}

#[test]
fn easy_mix_restore_keeps_its_part_and_returns_to_hardcore_after_whole_cup() {
    let mut g = mixed(1, 2, 0.5); g.set_mode(false); g.begin_ready(); advance(&mut g, 0.5, 120);
    let mut r = Game::restore(&g.save()).unwrap();
    assert!(!r.hardcore && !r.holding && r.part_attempted); assert_eq!(r.pour_part, 0);
    r.begin_pour(); advance(&mut r, 0.1, 120); r.end_pour(); assert!(r.serve());
    let mut second = Game::restore(&r.save()).unwrap();
    assert_eq!(second.pour_part, 1); assert!(!second.hardcore && !second.part_attempted); assert!(!second.serve());
    second.begin_pour(); advance(&mut second, 0.6, 120); second.end_pour(); assert!(second.serve());
    assert_eq!(second.completed, 1); second.next_order(); assert!(second.hardcore);
}

#[test]
fn malformed_mix_states_and_paid_ratio_grades_are_rejected() {
    let mut g = mixed(0, 3, 0.5); g.set_pressure(0); let amount = g.target * g.capacity * 0.5;
    pour_part_ml(&mut g, amount); let waiting = g.save();
    for (index, value) in [(97, 0.0), (97, 5.0), (98, 1.0), (98, 0.4), (99, 0.0), (99, 2.0),
        (100, 2.0), (101, -1.0), (101, waiting[6] + 1.0), (102, waiting[7] + 1.0),
        (103, waiting[8] + 1.0), (104, waiting[55] + 1.0), (104, 0.0), (106, 1.0), (83, 2.0), (86, 0.0)] {
        let mut bad = waiting; bad[index] = value; assert!(Game::restore(&bad).is_none(), "mix field {index}");
    }
    pour_part_ml(&mut g, amount); let paid = g.save(); assert_eq!(g.stars, 5);
    let mut bad = paid; bad[98] = 0.25; assert!(Game::restore(&bad).is_none(), "paid mix grade must agree with retained proportions");
    let mut bad = paid; bad[100] = 0.0; assert!(Game::restore(&bad).is_none(), "a paid final part must have an attempt");
}

#[test]
fn mixed_orders_introduce_half_then_quarters_without_prep_or_purchase_surprises() {
    let mut kinds = [false; 4]; let mut mixed_count = 0;
    for seed in 1..=12 {
        let mut g = Game::new(seed); wealthy(&mut g, 100000);
        for i in 9..12 { assert!(g.buy(i)); }
        for serial in 0..120 {
            if serial < 5 { assert!(!g.is_mix()); }
            if serial == 5 { assert!(g.is_mix()); assert_eq!(g.first_share, 0.5); }
            if g.is_mix() {
                mixed_count += 1; assert_ne!(g.soda, g.second_soda); assert_eq!(g.selected_soda, g.soda);
                assert!(!g.prep_started); assert_eq!(g.elapsed, 0.0); advance(&mut g, 1.0, 60); assert_eq!(g.elapsed, 0.0);
                assert!(g.ordered_cherries + g.ordered_lime + g.ordered_syrup <= 1); assert_eq!(g.ordered_blend, 1);
                if serial < 12 { assert_eq!(g.first_share, 0.5); }
                kinds[if g.first_share == 0.25 { 1 } else if g.first_share == 0.5 { 2 } else { 3 }] = true;
            } else { kinds[0] = true; }
            perfect(&mut g); next(&mut g);
        }
    }
    assert!(kinds.into_iter().all(|seen| seen)); assert!((350..550).contains(&mixed_count));
}

#[test]
fn genuine_v103_fixtures_preserve_every_released_snapshot_field() {
    fn array(source: &str, name: &str) -> Vec<f64> {
        let label = format!("\"{name}\":");
        let rest = source.split_once(&label).unwrap().1.split_once('[').unwrap().1.split_once(']').unwrap().0;
        rest.split(',').filter(|s| !s.trim().is_empty()).map(|s| s.trim().parse().unwrap()).collect()
    }
    for source in [include_str!("../fixtures/v103-preparing.json"), include_str!("../fixtures/v103-partial-hardcore.json"),
        include_str!("../fixtures/v103-partial-easy.json"), include_str!("../fixtures/v103-paid.json"), include_str!("../fixtures/v103-staffed-closed.json")] {
        let saved: [f64; SAVE_LEN] = array(source, "engine").try_into().unwrap(); assert_eq!(saved[0], 103.0);
        let expected: Vec<f32> = array(source, "expectedRestoreSnapshot").into_iter().map(|v| v as f32).collect();
        let restored = Game::restore(&saved).unwrap();
        assert_eq!(&restored.state()[..124], expected.as_slice()); assert!(!restored.is_mix());
        assert_eq!(restored.save()[0], 106.0);
    }
}

#[test]
fn ice_is_optional_free_and_locks_on_the_first_hold() {
    for hardcore in [false, true] {
        let mut g = Game::new(6106);
        assert!(g.set_mode(hardcore));
        assert_eq!(g.selected_ice, 0);
        assert!(!g.prep_started);
        assert!(g.set_ice(0));
        assert!(!g.prep_started, "repeating no ice does not start patience");
        let before = (g.capacity, g.target, g.menu_price(), g.addin_cost(), g.recipe_accuracy());
        assert!(!g.set_ice(6));
        assert!(g.set_ice(2));
        assert!(g.prep_started);
        assert_eq!(before, (g.capacity, g.target, g.menu_price(), g.addin_cost(), g.recipe_accuracy()));
        assert_eq!((g.state()[134], g.state()[135]), (2.0, 1.4));
        assert!(g.begin_ready());
        assert!(!g.set_ice(0));
        advance(&mut g, 0.75, 60);
        g.end_pour();
        assert!(!g.set_ice(1));
        if !hardcore { assert!(g.serve()); }
        let paid = g.save();
        assert!(!g.set_ice(0));
        assert_eq!(g.save(), paid);
        next(&mut g);
        assert_eq!(g.selected_ice, 0);
    }
}

#[test]
fn ice_adds_initial_gas_without_inventing_beverage_or_changing_flow() {
    let mut states = Vec::new();
    for scoops in 0..=2 {
        let mut g = Game::new(2);
        assert!(g.set_ice(scoops));
        assert!(g.begin_ready());
        let initial = g.ice_fizz();
        advance(&mut g, 0.6, 120);
        assert!(g.spill == 0.0);
        assert_eq!(g.capacity, 280.0);
        assert_eq!(g.flow(), 104.0);
        assert!((g.beverage_ml() - g.poured).abs() < 1e-8);
        if scoops > 0 { assert!(g.ice_fizz() < initial && g.ice_fizz() > 1.0); }
        states.push(g);
    }
    assert_eq!(states[0].liquid, states[1].liquid);
    assert_eq!(states[0].liquid, states[2].liquid);
    assert_eq!(states[0].foam_liquid, states[2].foam_liquid);
    assert!(states[0].foam < states[1].foam && states[1].foam < states[2].foam);
}

#[test]
fn iced_gentle_catalog_remains_solvable_in_both_modes() {
    let mut cases = 0;
    for scoops in 1..=2 { for soda in 0..4 { for cup in 0..4 { for target in [0.45,0.55,0.60,0.65,0.70,0.75,0.80] { for hardcore in [false,true] {
        let mut g = Game::new(106);
        g.soda = soda; g.cup = cup; g.capacity = CAPACITIES[cup]; g.target = target;
        assert!(g.set_mode(hardcore));
        assert!(g.set_ice(scoops));
        perfect(&mut g);
        assert_eq!(g.stars, 5, "ice={scoops} soda={soda} cup={cup} target={target} mode={hardcore}");
        cases += 1;
    }}}}}
    assert_eq!(cases, 448);
}

#[test]
fn iced_mixed_pours_conserve_both_sodas_and_share_physics_between_modes() {
    for scoops in 1..=2 {
        let mut hard = mixed(1, 3, 0.5);
        let mut easy = hard.clone();
        assert!(hard.set_ice(scoops)); assert!(easy.set_ice(scoops));
        assert!(easy.set_mode(false));
        for part in 0..2 {
            for g in [&mut hard, &mut easy] {
                assert!(g.begin_ready());
                advance(g, if part == 0 { 0.6 } else { 0.8 }, 120);
                assert!((g.liquid + g.foam_liquid + g.beverage_waste - g.poured).abs() < 1e-6);
                assert!(g.first_liquid + g.first_foam_liquid <= g.first_poured + 1e-6);
                g.end_pour(); if !g.hardcore { assert!(g.serve()); }
            }
            for i in [6,7,8,64,66,130,131,134,135] { assert_eq!(hard.state()[i], easy.state()[i], "part{part} field{i}"); }
        }
        let first = hard.first_beverage_ml(); let total = hard.beverage_ml();
        advance(&mut hard, 8.0, 60);
        assert_eq!((hard.first_beverage_ml(), hard.beverage_ml()), (first,total));
    }
}

#[test]
fn ice_saves_preserve_preparation_resume_and_one_time_payment() {
    let mut preparing = Game::new(106);
    assert!(preparing.set_ice(2));
    let saved = preparing.save(); assert_eq!(saved[0], 106.0); assert_eq!(saved[105], 2.0);
    let restored = Game::restore(&saved).unwrap(); assert_eq!(restored.selected_ice, 2); assert!(!restored.attempted);
    let mut hard = mixed(0,3,0.5); assert!(hard.set_ice(1)); assert!(hard.begin_ready()); advance(&mut hard,0.5,120);
    let mut restored = Game::restore(&hard.save()).unwrap();
    assert_eq!((restored.selected_ice,restored.pour_part,restored.completed,restored.part_attempted),(1,1,0,false));
    let repeated = Game::restore(&restored.save()).unwrap(); assert_eq!(repeated.poured,restored.poured); assert_eq!(repeated.ice_fizz(),restored.ice_fizz());
    assert!(restored.begin_pour()); advance(&mut restored,0.7,120); restored.end_pour();
    let paid = restored.save(); let cash = restored.cash; let count = restored.completed;
    let mut reopened = Game::restore(&paid).unwrap(); assert_eq!(reopened.selected_ice,1);
    reopened.end_pour(); assert!(!reopened.serve()); advance(&mut reopened,4.0,60);
    assert_eq!((reopened.cash,reopened.completed),(cash,count));
    let mut easy = Game::new(106); easy.set_mode(false); easy.set_ice(2); easy.begin_ready(); advance(&mut easy,0.4,120); easy.end_pour();
    let mut resumed = Game::restore(&easy.save()).unwrap(); assert_eq!((resumed.selected_ice,resumed.hardcore,resumed.holding),(2,false,false));
    assert!(!resumed.set_ice(0)); assert!(resumed.begin_pour());
}

#[test]
fn v104_import_defaults_to_no_ice_and_ice_validation_is_atomic() {
    let g = Game::new(106); let mut old = g.save(); old[0] = 104.0;
    let restored = Game::restore(&old).unwrap(); assert_eq!(restored.selected_ice,0);
    assert_eq!(&restored.state()[..134],&g.state()[..134]);
    old[105] = 1.0; assert!(Game::restore(&old).is_none(), "104 retains its original reserved range");
    let mut g = Game::new(106); g.set_ice(2); let saved = g.save();
    for (index,value) in [(105,-1.0),(105,3.0),(105,0.5),(106,1.0),(119,1.0),(92,0.0)] {
        let mut bad = saved; bad[index] = value; assert!(Game::restore(&bad).is_none(), "bad index{index} value{value}");
    }
}

#[test]
fn all_four_ingredient_trays_cap_at_five_and_restore() {
    let mut g = Game::new(106);
    g.upgrades[9] = 1; g.upgrades[10] = 1; g.refresh();
    assert!(g.set_recipe(0, 5, 5, 5, 1));
    assert!(g.set_ice(5));
    assert_eq!((g.selected_cherries, g.selected_lime, g.selected_syrup, g.selected_ice), (5, 5, 5, 5));
    assert_eq!(g.addin_cost(), 5 * (8 + 10 + 12));
    assert!((g.ice_fizz() - 2.0).abs() < 1e-9);
    let save = g.save();
    let restored = Game::restore(&save).expect("maximum garnishes and ice restore");
    assert_eq!((restored.selected_cherries, restored.selected_lime, restored.selected_syrup, restored.selected_ice), (5, 5, 5, 5));
    for invalid in [(6, 5, 5), (5, 6, 5), (5, 5, 6)] {
        assert!(!g.set_recipe(0, invalid.0, invalid.1, invalid.2, 1));
        assert_eq!(g.save(), save);
    }
    assert!(!g.set_ice(6));
    assert_eq!(g.save(), save);
    for slot in [88, 89, 90, 105] {
        let mut bad = save;
        bad[slot] = 6.0;
        assert!(Game::restore(&bad).is_none());
    }
    let mut old = save;
    old[0] = 104.0; old[105] = 0.0;
    assert!(Game::restore(&old).is_none(), "older saves retain their original ingredient caps");
    assert!(g.begin_pour());
    assert!(!g.set_recipe(0, 0, 0, 0, 1));
    assert!(!g.set_ice(0));
}
