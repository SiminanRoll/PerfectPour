use super::*;

fn advance(g: &mut Game, seconds: f64, fps: u32) {
    let mut left = seconds;
    while left > 1e-8 {
        let dt = left.min(1.0 / fps as f64);
        g.step(dt as f32);
        left -= dt;
    }
}

fn perfect(g: &mut Game) {
    // Economy fixtures use a low-fizz recipe. Generated requests are no longer
    // guaranteed to permit a perfect uninterrupted pour with every soda.
    g.soda = 0;
    assert!(g.begin_pour());
    advance(g, g.target * g.capacity / RATES[g.soda], 120);
    g.end_pour();
    if !g.hardcore { assert!(g.serve()); }
    assert_eq!(g.stars, 5, "soda={} cup={} target={} score={}", g.soda, g.cup, g.target, g.accuracy);
}

fn finish(g: &mut Game) {
    while g.phase != 2 {
        if g.phase == 0 { perfect(g); }
        g.next_order();
    }
}

fn wealthy(g: &mut Game, cents: u32) {
    g.cash = cents;
    g.lifetime_gross = cents;
    g.refresh();
}

#[test]
fn new_career_defaults_to_hardcore_with_gentle_first_order() {
    let g = Game::new(3);
    assert_eq!(&g.state()[0..6], &[0.0, 1.0, 0.0, 0.0, 0.65, 280.0]);
    assert!(g.hardcore);
    assert_eq!((g.cash, g.day, g.goal), (0, 1, 12));
    assert_eq!(g.rating, 3.5);
}

#[test]
fn hardcore_release_scores_once_and_forbids_every_topup_path() {
    let mut g = Game::new(9);
    assert!(g.begin_pour());
    assert!(!g.begin_pour());
    assert!(!g.serve());
    advance(&mut g, 1.75, 120);
    g.end_pour();
    assert_eq!(g.phase, 1);
    assert_eq!(g.stars, 5);
    assert_eq!(g.payout, 399);
    let paid = g.state().to_owned();
    assert!(!g.begin_pour());
    assert!(!g.serve());
    g.end_pour();
    g.step(0.25);
    assert_eq!(&g.state()[..6], &paid[..6]);
    assert_eq!(&g.state()[8..], &paid[8..]);
    assert!(g.state()[6] > paid[6]);
    assert!(g.state()[7] < paid[7]);
    assert_eq!(g.completed, 1);
}

#[test]
fn a_zero_duration_press_still_uses_the_single_attempt() {
    let mut g = Game::new(1);
    assert!(g.begin_pour());
    g.end_pour();
    assert_eq!((g.phase, g.stars, g.completed), (1, 1, 1));
    assert!(!g.begin_pour());
}

#[test]
fn easy_supports_multiple_holds_and_manual_serve() {
    let mut g = Game::new(9);
    assert!(g.set_mode(false));
    assert!(!g.serve());
    for _ in 0..2 {
        assert!(g.begin_pour());
        advance(&mut g, 0.875, 60);
        g.end_pour();
        assert_eq!(g.phase, 0);
        assert_eq!(g.cash, 0);
        advance(&mut g, 0.4, 60);
    }
    assert!(g.serve());
    assert_eq!(g.stars, 5);
    assert_eq!(g.payout, 350);
    assert!(!g.serve());
}

#[test]
fn mode_locks_from_first_press_until_review() {
    let mut g = Game::new(1);
    assert!(g.set_mode(false));
    g.begin_pour();
    assert!(!g.set_mode(true));
    g.end_pour();
    assert!(!g.set_mode(true));
    g.serve();
    assert!(g.set_mode(true));
    finish(&mut g);
    assert!(g.set_mode(false));
}

#[test]
fn bad_review_lowers_future_locked_price_and_good_service_recovers() {
    let mut g = Game::new(1);
    g.begin_pour(); g.end_pour();
    assert!(g.rating < 3.5);
    assert_eq!(g.multiplier, 1.3);
    let low = g.rating;
    g.next_order();
    assert!(g.multiplier < 1.3);
    perfect(&mut g);
    assert!(g.rating > low);
}

#[test]
fn foam_settles_without_losing_beverage_or_counting_gas_as_soda() {
    let mut g = Game::new(1);
    g.set_mode(false);
    g.soda = 3;
    g.begin_pour();
    advance(&mut g, 1.0, 120);
    g.end_pour();
    let actual = g.liquid + g.foam_liquid;
    let before_foam = g.foam;
    assert!(before_foam > 20.0);
    assert!((actual - 98.0).abs() < 0.0001);
    advance(&mut g, 8.0, 60);
    assert!(g.foam < before_foam * 0.01);
    assert!((g.liquid + g.foam_liquid - actual).abs() < 0.0001);
    g.serve();
    assert!((g.beverage_ml() - actual).abs() < 0.0001);
    advance(&mut g, 4.0, 60);
    assert!((g.liquid - actual).abs() < 0.0001);
    assert_eq!((g.foam, g.foam_liquid), (0.0, 0.0));
}

#[test]
fn overfill_is_bounded_and_overflow_is_penalized() {
    let mut g = Game::new(4);
    g.begin_pour();
    advance(&mut g, 12.0, 60);
    assert!(g.spill > 0.0);
    assert!(g.liquid + g.foam <= g.capacity + 0.00001);
    g.end_pour();
    assert_eq!(g.stars, 1);
    assert!(g.accuracy < 50.0);
}

#[test]
fn equal_hold_times_agree_across_render_frame_rates() {
    let mut states = Vec::new();
    for fps in [30, 60, 120] {
        let mut g = Game::new(4);
        g.begin_pour();
        advance(&mut g, 1.5, fps);
        states.push((g.liquid, g.foam, g.foam_liquid));
    }
    for other in &states[1..] {
        assert!((states[0].0 - other.0).abs() < 0.001);
        assert!((states[0].1 - other.1).abs() < 0.001);
        assert!((states[0].2 - other.2).abs() < 0.001);
    }
}

#[test]
fn invalid_times_and_idle_frames_cannot_start_a_pour() {
    let mut g = Game::new(1);
    for dt in [f32::NAN, f32::INFINITY, f32::NEG_INFINITY, -1.0, 0.0, 0.25] { g.step(dt); }
    assert_eq!(g.liquid, 0.0);
    assert!(!g.attempted);
    assert!(g.state().iter().all(|x| x.is_finite()));
    g.begin_pour();
    g.step(100.0);
    assert!((g.liquid + g.foam_liquid - 26.0).abs() < 0.00001);
}

#[test]
fn generated_orders_use_every_target_for_each_soda_cup_and_tap_level() {
    let targets = [0.45, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80];
    let mut seen = [[[[false; 7]; 4]; 4]; 3];
    for tap in 0..=2 {
        for seed in 1..=64 {
            let mut g = Game::new(seed);
            g.upgrades[3] = tap;
            for day in 1..=2 {
                while g.phase != 2 {
                    let target = targets.iter().position(|value| *value == g.target).unwrap();
                    seen[tap as usize][g.soda][g.cup][target] = true;
                    assert!(g.begin_pour());
                    g.end_pour();
                    g.next_order();
                }
                if day == 1 { assert!(g.next_day(seed + 7919)); }
            }
        }
    }
    assert!(seen.iter().flatten().flatten().flatten().all(|value| *value));
}

#[test]
fn same_seed_repeats_order_sequence_across_modes_and_tap_levels() {
    let mut games = Vec::new();
    for hardcore in [true, false] {
        for tap in 0..=2 {
            let mut g = Game::new(777);
            g.set_mode(hardcore);
            g.upgrades[3] = tap;
            games.push(g);
        }
    }
    for day in 1..=2 {
        for _ in 0..12 {
            let expected = (games[0].soda, games[0].cup, games[0].target);
            for g in &mut games {
                assert_eq!((g.soda, g.cup, g.target), expected);
                assert!(g.begin_pour());
                g.end_pour();
                if !g.hardcore { assert!(g.serve()); }
                g.next_order();
            }
        }
        if day == 1 {
            for g in &mut games { assert!(g.next_day(7919)); }
        }
    }
}

#[test]
fn both_modes_share_pouring_settling_and_scoring_physics() {
    for soda in 0..4 {
        for cup in 0..4 {
            for tap in 0..=2 {
                for seconds in [0.8, 2.5] {
                    let mut hard = Game::new(1);
                    hard.soda = soda;
                    hard.cup = cup;
                    hard.capacity = CAPACITIES[cup];
                    hard.upgrades[3] = tap;
                    let mut easy = hard.clone();
                    easy.set_mode(false);
                    assert!(hard.begin_pour());
                    assert!(easy.begin_pour());
                    advance(&mut hard, seconds, 60);
                    advance(&mut easy, seconds, 60);
                    assert_eq!((hard.liquid, hard.foam, hard.foam_liquid, hard.spill),
                        (easy.liquid, easy.foam, easy.foam_liquid, easy.spill));
                    hard.end_pour();
                    easy.end_pour();
                    assert_eq!(hard.phase, 1);
                    assert_eq!(easy.phase, 0);
                    advance(&mut hard, 0.5, 60);
                    advance(&mut easy, 0.5, 60);
                    assert_eq!((hard.liquid, hard.foam, hard.foam_liquid, hard.spill),
                        (easy.liquid, easy.foam, easy.foam_liquid, easy.spill));
                    assert!(easy.serve());
                    assert!((hard.accuracy - easy.accuracy).abs() < 0.000001);
                    assert_eq!(hard.stars, easy.stars);
                }
            }
        }
    }
}

#[test]
fn easy_can_wait_and_top_up_a_high_fizz_order_that_overflows_in_one_hold() {
    let mut hard = Game::new(1);
    hard.soda = 3;
    hard.target = 0.80;
    let mut easy = hard.clone();
    easy.set_mode(false);
    let seconds = hard.target * hard.capacity / RATES[hard.soda];
    hard.begin_pour();
    advance(&mut hard, seconds, 120);
    hard.end_pour();
    assert!(hard.spill > 50.0);
    assert!(hard.accuracy < 60.0);
    assert!(!hard.begin_pour());
    for hold in 0..4 {
        assert!(easy.begin_pour());
        advance(&mut easy, seconds / 4.0, 120);
        easy.end_pour();
        if hold < 3 { advance(&mut easy, 4.0, 60); }
    }
    assert_eq!(easy.spill, 0.0);
    assert!(easy.serve());
    assert!(easy.accuracy > 99.99);
    assert!(easy.foam > 50.0);
}

#[test]
fn high_fizz_stop_timing_changes_fill_overflow_and_review() {
    let mut pours = Vec::new();
    for seconds in [1.6, 1.85, 2.5] {
        let mut g = Game::new(1);
        g.soda = 3;
        g.begin_pour();
        advance(&mut g, seconds, 120);
        g.end_pour();
        pours.push(g);
    }
    let (early, on_time, late) = (&pours[0], &pours[1], &pours[2]);
    assert!(early.beverage_ml() < on_time.beverage_ml());
    assert!(early.accuracy < on_time.accuracy);
    assert_eq!(on_time.spill, 0.0);
    assert!(on_time.accuracy > 99.0);
    assert!(on_time.liquid < on_time.target * on_time.capacity - 10.0);
    assert!(on_time.foam > 100.0);
    assert!(late.spill > 0.0);
    assert!(late.accuracy < on_time.accuracy);
}

#[test]
fn served_foam_settles_without_changing_the_paid_result_or_service_time() {
    for hardcore in [true, false] {
        let mut g = Game::new(1);
        g.soda = 3;
        g.set_mode(hardcore);
        g.begin_pour();
        advance(&mut g, 1.0, 120);
        let cup = (g.liquid, g.foam, g.foam_liquid);
        g.end_pour();
        if !hardcore { assert!(g.serve()); }
        assert_eq!((g.liquid, g.foam, g.foam_liquid), cup);
        assert!(g.foam > 20.0);
        let paid = *g.state();
        let beverage = g.beverage_ml();
        advance(&mut g, 15.0, 60);
        assert_eq!((g.foam, g.foam_liquid), (0.0, 0.0));
        assert!((g.liquid - beverage).abs() < 0.000001);
        assert_eq!(&g.state()[..6], &paid[..6]);
        assert_eq!(&g.state()[8..], &paid[8..]);
        assert!(!g.begin_pour());
        assert!(!g.serve());
        g.end_pour();
        assert_eq!(g.completed, 1);
        assert_eq!(g.cash as f32, paid[20]);
    }
}

#[test]
fn streak_rewards_vary_and_bad_service_breaks_the_combo() {
    let mut g = Game::new(1);
    for n in 1..=8 {
        perfect(&mut g);
        assert_eq!(g.streak, n);
        assert_eq!(g.last_perfect_tip, 25);
        assert_eq!(g.last_milestone, match n { 3 => 100, 5 => 200, 8 => 400, _ => 0 });
        assert_eq!(g.payout, g.last_base + g.last_combo + g.last_milestone + 25);
        if n >= 2 { assert!(g.last_combo > 0); }
        g.next_order();
    }
    assert_eq!(g.combo(), 1.4);
    g.begin_pour(); g.end_pour();
    assert_eq!(g.streak, 0);
    assert_eq!(g.combo(), 1.0);
    assert_eq!(g.last_combo, 0);
    assert_eq!(g.best_streak, 8);
}

#[test]
fn four_star_pours_build_combo_and_three_star_pours_break_it() {
    let mut g = Game::new(3);
    let first_seconds = (g.target - 0.02) * g.capacity / RATES[0];
    g.begin_pour();
    advance(&mut g, first_seconds, 120);
    g.end_pour();
    assert_eq!((g.stars, g.streak, g.last_perfect_tip), (4, 1, 0));
    g.next_order();
    g.soda = 0;
    let seconds = (g.target - 0.06) * g.capacity / RATES[g.soda];
    g.begin_pour(); advance(&mut g, seconds, 120); g.end_pour();
    assert_eq!((g.stars, g.streak), (3, 0));
}

#[test]
fn changing_mode_clears_current_streak_without_changing_paid_review() {
    let mut g = Game::new(1);
    perfect(&mut g);
    let cash = g.cash;
    assert!(g.set_mode(false));
    assert_eq!((g.streak, g.best_streak, g.cash), (0, 1, cash));
}

#[test]
fn purchases_spend_real_cash_and_enforce_maximums_and_affordability() {
    let mut g = Game::new(1);
    assert!(!g.buy(0));
    assert!(!g.buy(99));
    wealthy(&mut g, 7000);
    assert!(g.buy(0)); assert_eq!(g.cash, 5800);
    assert!(g.buy(0)); assert_eq!(g.cash, 3600);
    assert!(g.buy(0)); assert_eq!(g.cash, 0);
    assert!(!g.buy(0)); assert_eq!(g.cost(0), 0);
    assert_eq!(g.upgrades[0], 3);
    assert_eq!(g.lifetime_gross, 7000);
}

#[test]
fn a_started_cup_locks_purchases_until_review_in_both_modes() {
    for hardcore in [true, false] {
        let mut g = Game::new(1);
        wealthy(&mut g, 10000);
        g.set_mode(hardcore);
        g.begin_pour();
        assert!(!g.buy(0));
        g.end_pour();
        if !hardcore { assert!(!g.buy(0)); g.serve(); }
        assert!(g.buy(0));
    }
}

#[test]
fn tap_equipment_reduces_gas_but_preserves_actual_beverage() {
    let mut plain = Game::new(1);
    plain.soda = 3;
    let mut upgraded = plain.clone();
    upgraded.upgrades[3] = 2;
    plain.begin_pour(); upgraded.begin_pour();
    advance(&mut plain, 1.0, 120); advance(&mut upgraded, 1.0, 120);
    assert!(upgraded.foam < plain.foam * 0.7);
    assert!((plain.liquid + plain.foam_liquid - upgraded.liquid - upgraded.foam_liquid).abs() < 0.00001);
}

#[test]
fn sign_and_awning_benefits_start_on_untouched_order_without_rewriting_paid_review() {
    let mut g = Game::new(1);
    wealthy(&mut g, 10000);
    assert!(g.buy(0)); assert!(g.buy(2));
    perfect(&mut g);
    assert_eq!(g.last_base, 392);
    assert_eq!(g.last_service_tip, 15);
    let paid = g.payout;
    assert!(g.buy(0)); assert!(g.buy(2));
    assert_eq!(g.payout, paid);
    assert_eq!(g.last_service_tip, 15);
}

#[test]
fn seating_and_hired_staff_start_on_the_following_day() {
    let mut g = Game::new(1);
    wealthy(&mut g, 20000);
    for item in [1, 4, 5] { assert!(g.buy(item)); }
    assert_eq!(g.goal, 12);
    assert!(!g.active_helper && !g.active_specialist);
    finish(&mut g);
    assert_eq!((g.staff_sales, g.wages_paid), (0, 0));
    assert!(g.next_day(22));
    assert_eq!(g.goal, 14);
    assert!(g.active_helper && g.active_specialist);
    assert_eq!(g.wages_due(), 400);
    perfect(&mut g);
    assert_eq!(g.last_service_tip, 35);
}

#[test]
fn staff_sales_and_payroll_are_real_and_processed_once_per_day() {
    let mut g = Game::new(1);
    wealthy(&mut g, 20000);
    g.buy(4); g.buy(5); finish(&mut g); g.next_day(22);
    while g.completed < g.goal { perfect(&mut g); if g.completed < g.goal { g.next_order(); } }
    let before = g.cash;
    let gross = g.shift_gross;
    g.next_order();
    assert_eq!(g.wages_paid, 400);
    assert!(g.staff_sales >= 320);
    assert_eq!(g.cash, before + g.staff_sales - 400);
    assert_eq!(g.shift_gross, gross + g.staff_sales);
    assert_eq!(g.lifetime_customers, 26);
    let state = *g.state();
    g.next_order(); g.end_pour(); g.serve();
    g.step(0.25);
    assert_eq!(*g.state(), state);
}

#[test]
fn purchases_reserve_committed_daily_wages() {
    let mut g = Game::new(1);
    wealthy(&mut g, 1500);
    g.upgrades[4] = 1; g.upgrades[5] = 1;
    g.active_helper = true; g.active_specialist = true;
    g.refresh();
    assert_eq!(g.spendable(), 1100);
    assert!(!g.buy(0));
    assert_eq!(g.cash, 1500);
}

#[test]
fn next_day_preserves_career_and_resets_only_shift_fields() {
    let mut g = Game::new(42);
    assert!(!g.next_day(99));
    finish(&mut g);
    let saved = (g.cash, g.rating, g.lifetime_gross, g.best_streak, g.streak);
    assert!(g.next_day(99));
    assert_eq!(saved, (g.cash, g.rating, g.lifetime_gross, g.best_streak, g.streak));
    assert_eq!((g.day, g.order, g.completed, g.shift_gross), (2, 1, 0, 0));
    assert!(!g.next_day(100));
}

#[test]
fn f64_save_roundtrip_preserves_paid_review_and_blocks_duplicate_reward() {
    let mut g = Game::new(1);
    perfect(&mut g);
    assert!(g.foam > 0.0);
    let s = g.save();
    assert_eq!(s[0], 101.0);
    assert_eq!(s[6], g.beverage_ml());
    assert_eq!((s[7], s[8]), (0.0, 0.0));
    let mut restored = Game::restore(&s).unwrap();
    assert_eq!((restored.foam, restored.foam_liquid), (0.0, 0.0));
    assert_eq!(restored.save(), s);
    let cash = restored.cash;
    assert!(!restored.begin_pour());
    assert!(!restored.serve());
    restored.end_pour();
    advance(&mut restored, 2.0, 60);
    assert_eq!(restored.save(), s);
    assert_eq!(restored.cash, cash);
    restored.next_order();
    assert_eq!(restored.order, 2);
    assert_eq!(restored.cash, cash);
}

#[test]
fn unfinished_cup_restores_untouched_without_money_or_review() {
    let mut g = Game::new(1);
    perfect(&mut g); g.next_order(); g.begin_pour();
    advance(&mut g, 0.9, 120);
    let r = Game::restore(&g.save()).unwrap();
    assert_eq!((r.phase, r.cash, r.completed), (0, g.cash, 1));
    assert_eq!(r.liquid, 0.0);
    assert!(!r.attempted && !r.holding);
    assert_eq!((r.soda, r.cup, r.target), (g.soda, g.cup, g.target));
}

#[test]
fn restore_defaults_to_hardcore_and_resets_a_saved_easy_streak() {
    let mut g = Game::new(1);
    g.set_mode(false);
    perfect(&mut g);
    let r = Game::restore(&g.save()).unwrap();
    assert!(r.hardcore);
    assert_eq!((r.streak, r.best_streak), (0, 1));
    assert_eq!(r.cash, g.cash);
}

#[test]
fn invalid_save_values_fail_validation_without_panics() {
    let g = Game::new(1);
    let valid = g.save();
    for (index, value) in [(0, 100.0), (1, 8.0), (3, 4.0), (10, f64::NAN),
        (20, 0.0), (21, -1.0), (21, 1.0), (25, 1.5), (26, 13.0),
        (28, 9.0), (34, 4.0), (44, 1.0), (79, 1.0), (6, f64::INFINITY)] {
        let mut bad = valid;
        bad[index] = value;
        assert!(Game::restore(&bad).is_none(), "index={index} value={value}");
    }
    assert!(Game::restore(&valid).is_some());
}

#[test]
fn full_business_save_roundtrip_preserves_payroll_and_exact_large_cents() {
    let mut g = Game::new(1);
    wealthy(&mut g, 100_000_001);
    for item in 0..6 { while g.cost(item) > 0 { assert!(g.buy(item)); } }
    finish(&mut g); g.next_day(55); finish(&mut g);
    let saved = g.save();
    let restored = Game::restore(&saved).unwrap();
    assert_eq!(restored.save(), saved);
    assert_eq!(restored.cash, g.cash);
    assert_eq!(restored.wages_paid, 400);
    assert_eq!(restored.upgrades, UPGRADE_MAX);
}
