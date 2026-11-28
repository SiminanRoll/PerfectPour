//! Perfect Pour V1.06: deterministic, dependency-free game and business rules.
//! The browser renders the snapshot. Rust owns every scored and paid action.

const SNAPSHOT_LEN: usize = 148;
const SAVE_LEN: usize = 120;
const SAVE_VERSION: f64 = 107.0;
const MAX_CENTS: u32 = 1_000_000_000;
const MAX_COUNT: u32 = 1_000_000;
const CAPACITIES: [f64; 4] = [280.0, 360.0, 460.0, 330.0];
const RATES: [f64; 4] = [104.0, 94.0, 110.0, 98.0];
const ENTRAINED: [f64; 4] = [0.065, 0.105, 0.145, 0.18];
const EXPANSION: [f64; 4] = [5.0, 6.0, 7.0, 8.0];
const SETTLE_RATES: [f64; 4] = [1.8, 1.55, 1.3, 1.1];
const PRESSURE_FLOW: [f64; 3] = [0.55, 1.0, 1.35];
const PRESSURE_GAS: [f64; 3] = [0.8, 1.0, 1.15];
const BLEND_GAS: [f64; 3] = [1.08, 1.0, 0.92];
const BLEND_COST: [f64; 3] = [0.9, 1.0, 1.15];
const UPGRADE_MAX: [u32; 12] = [3, 2, 2, 2, 1, 1, 3, 3, 3, 1, 1, 1];
const COSTS: [[u32; 3]; 12] = [
    [1200, 2200, 3600], [1800, 3000, 0], [1400, 2400, 0],
    [1800, 3000, 0], [2800, 0, 0], [4200, 0, 0],
    [10000, 18000, 30000], [14000, 24000, 40000], [5000, 8500, 13000],
    [1000, 0, 0], [1800, 0, 0], [2600, 0, 0],
];

#[derive(Clone, Debug)]
pub struct Game {
    phase: u32, order: u32, soda: usize, cup: usize, target: f64,
    capacity: f64, liquid: f64, foam: f64, foam_liquid: f64, spill: f64,
    rating: f64, shift_gross: u32, accuracy: f64, stars: u32, payout: u32,
    multiplier: f64, elapsed: f64, completed: u32, accuracy_sum: f64,
    perfect: u32, rng: u32, cash: u32, hardcore: bool, attempted: bool,
    holding: bool, day: u32, goal: u32, streak: u32, best_streak: u32,
    last_combo: u32, last_milestone: u32, last_perfect_tip: u32,
    last_service_tip: u32, lifetime_gross: u32, upgrades: [u32; 12],
    active_helper: bool, active_specialist: bool, staff_sales: u32,
    wages_paid: u32, day_closed: bool, lifetime_customers: u32,
    last_base: u32, lifetime_perfect: u32, best_shift_gross: u32,
    previous_rating: f64, last_was_good: bool, order_sign: u32,
    order_awning: u32, pressure: usize, beverage_waste: f64, poured: f64,
    cleanup_seconds: f64, last_ingredient: u32, last_cleanup: u32,
    last_refund: u32, last_net: i64, shift_ingredients: u32,
    shift_cleanup: u32, shift_refunds: u32, shift_sign: u32,
    shift_service: u32, staff_orders: u32, staff_capacity: u32,
    queued_demand: u32, missed_customers: u32, hard_best: u32,
    easy_best: u32, cleanup_saved: f64, staff_work: f64,
    active_patio: u32, active_interior: u32, active_catering: u32,
    active_training: u32, last_hardcore: bool, resume_hardcore: bool,
    ordered_cherries: u32, ordered_lime: u32, ordered_syrup: u32, ordered_blend: usize,
    selected_soda: usize, selected_cherries: u32, selected_lime: u32,
    selected_syrup: u32, selected_blend: usize, selected_ice: u32, prep_started: bool, prep_allowance: f64,
    second_soda: usize, first_share: f64, pour_part: u32, part_attempted: bool,
    first_liquid: f64, first_foam: f64, first_foam_liquid: f64, first_poured: f64,
    scored_beverage: f64, scored_first_beverage: f64,
    // Permanent regular relationships and today's finite promotion.
    loyalty: [u32; 4], special_hits: u32,
    last_regular_tip: u32, last_special_tip: u32,
    shift_regular_tips: u32, shift_special_tips: u32,
    snapshot: [f32; SNAPSHOT_LEN],
}

impl Game {
    const fn empty() -> Self {
        Self {
            phase: 0, order: 1, soda: 0, cup: 0, target: 0.65,
            capacity: 280.0, liquid: 0.0, foam: 0.0, foam_liquid: 0.0,
            spill: 0.0, rating: 3.5, shift_gross: 0, accuracy: 0.0,
            stars: 0, payout: 0, multiplier: 1.3, elapsed: 0.0,
            completed: 0, accuracy_sum: 0.0, perfect: 0, rng: 1,
            cash: 0, hardcore: true, attempted: false, holding: false,
            day: 1, goal: 12, streak: 0, best_streak: 0, last_combo: 0,
            last_milestone: 0, last_perfect_tip: 0, last_service_tip: 0,
            lifetime_gross: 0, upgrades: [0; 12], active_helper: false,
            active_specialist: false, staff_sales: 0, wages_paid: 0,
            day_closed: false, lifetime_customers: 0, last_base: 0,
            lifetime_perfect: 0, best_shift_gross: 0, previous_rating: 3.5,
            last_was_good: false, order_sign: 0, order_awning: 0,
            pressure: 1, beverage_waste: 0.0, poured: 0.0,
            cleanup_seconds: 0.0, last_ingredient: 0, last_cleanup: 0,
            last_refund: 0, last_net: 0, shift_ingredients: 0,
            shift_cleanup: 0, shift_refunds: 0, shift_sign: 0,
            shift_service: 0, staff_orders: 0, staff_capacity: 0,
            queued_demand: 2, missed_customers: 0, hard_best: 0,
            easy_best: 0, cleanup_saved: 0.0, staff_work: 0.0,
            active_patio: 0, active_interior: 0, active_catering: 0,
            active_training: 0, last_hardcore: true, resume_hardcore: false,
            ordered_cherries: 1, ordered_lime: 0, ordered_syrup: 0, ordered_blend: 1,
            selected_soda: 4, selected_cherries: 0, selected_lime: 0,
            selected_syrup: 0, selected_blend: 1, selected_ice: 0, prep_started: false, prep_allowance: 3.5,
            second_soda: 4, first_share: 1.0, pour_part: 0, part_attempted: false,
            first_liquid: 0.0, first_foam: 0.0, first_foam_liquid: 0.0, first_poured: 0.0,
            scored_beverage: 0.0, scored_first_beverage: 0.0,
            loyalty: [0; 4], special_hits: 0,
            last_regular_tip: 0, last_special_tip: 0,
            shift_regular_tips: 0, shift_special_tips: 0,
            snapshot: [0.0; SNAPSHOT_LEN],
        }
    }

    pub fn new(seed: u32) -> Self {
        let mut game = Self::empty();
        game.rng = nonzero_seed(seed);
        game.refresh();
        game
    }

    fn random(&mut self) -> u32 {
        let mut x = self.rng;
        x ^= x << 13; x ^= x >> 17; x ^= x << 5;
        self.rng = x; x
    }

    pub fn begin_pour(&mut self) -> bool {
        if self.phase != 0 || self.holding || self.selected_soda > 3
            || (self.hardcore && self.part_attempted) { return false; }
        self.prep_started = true; self.attempted = true; self.part_attempted = true;
        self.holding = true; self.refresh(); true
    }

    /// A recipe is freely adjustable before the first hold. Even Easy locks its
    /// ingredients once liquid is poured; only additional liquid can be added.
    pub fn set_recipe(&mut self, soda: usize, cherries: u32, lime: u32, syrup: u32, blend: usize) -> bool {
        if self.phase != 0 || self.attempted || soda > 4 || cherries > 5 || lime > 5 || syrup > 5 || blend > 2
            || (lime > 0 && self.upgrades[9] == 0) || (syrup > 0 && self.upgrades[10] == 0)
            || (blend != 1 && self.upgrades[11] == 0) { return false; }
        let changed = (self.selected_soda, self.selected_cherries, self.selected_lime, self.selected_syrup, self.selected_blend)
            != (soda, cherries, lime, syrup, blend);
        self.selected_soda = soda; self.selected_cherries = cherries; self.selected_lime = lime;
        self.selected_syrup = syrup; self.selected_blend = blend;
        self.prep_started |= changed;
        self.refresh(); true
    }

    pub fn end_pour(&mut self) {
        if self.phase != 0 || !self.holding { return; }
        self.holding = false;
        if self.hardcore { self.complete_part(); } else { self.refresh(); }
    }

    fn complete_part(&mut self) {
        if self.phase != 0 || !self.part_attempted { return; }
        self.holding = false;
        if self.is_mix() && self.pour_part == 0 {
            self.pour_part = 1; self.part_attempted = false; self.refresh();
        } else { self.score(); }
    }

    pub fn set_pressure(&mut self, pressure: usize) -> bool {
        if pressure > 2 || self.phase != 0 || self.attempted { return false; }
        self.pressure = pressure; self.refresh(); true
    }

    /// Ice is an optional free preparation choice, not an ordered garnish.
    /// It changes gas expansion only and locks with the cup's first attempt.
    pub fn set_ice(&mut self, scoops: u32) -> bool {
        if scoops > 5 || self.phase != 0 || self.attempted { return false; }
        self.prep_started |= self.selected_ice != scoops;
        self.selected_ice = scoops;
        self.refresh(); true
    }

    /// Input owns pouring. Fixed substeps keep liquid stable across frame rates.
    /// Review physics cannot change the settled sale, service clock or staff work.
    pub fn step(&mut self, dt: f32) {
        if self.phase > 1 || !dt.is_finite() || dt <= 0.0 { return; }
        let mut remaining = (dt as f64).min(0.25);
        while remaining > 0.00000001 {
            let h = remaining.min(1.0 / 240.0);
            self.tick(h, self.phase == 0 && self.holding);
            remaining -= h;
        }
        self.refresh();
    }

    // Three familiar faces visit per shift from day 2 onward. The identity
    // is derived from day and customer number, not RNG or current UI state.
    fn regular_id(&self) -> usize {
        let slot = if self.phase == 0 { self.completed } else { self.completed.saturating_sub(1) };
        if self.day >= 2 && slot < self.goal && slot % 4 == 2 {
            ((self.day - 2 + slot / 4) % 4) as usize
        } else { 4 }
    }
    fn special_soda(&self) -> usize { ((self.day - 1) % 4) as usize }
    fn is_mix(&self) -> bool { self.second_soda < 4 }
    fn first_soda(&self) -> usize { if self.selected_soda < 4 { self.selected_soda } else { self.soda } }
    fn actual_soda(&self) -> usize { if self.is_mix() && self.pour_part == 1 { self.second_soda } else { self.first_soda() } }
    fn active_target(&self) -> f64 { self.target * if self.is_mix() && self.pour_part == 0 { self.first_share } else { 1.0 } }
    fn flow(&self) -> f64 { RATES[self.actual_soda()] * PRESSURE_FLOW[self.pressure] }
    fn recipe_fizz(&self) -> f64 { BLEND_GAS[self.selected_blend] }
    fn foam_multiplier(&self) -> f64 { 1.0 - 0.2 * self.upgrades[3] as f64 }
    /// Extra nucleation is strongest at first contact. Using cumulative poured
    /// volume keeps the effect deterministic across pauses, modes and reloads.
    /// This is a bounded game-feel model: no temperature or melting simulation.
    fn ice_fizz(&self) -> f64 {
        1.0 + self.selected_ice as f64 * (0.08 + 0.12 / (1.0 + self.poured / 90.0))
    }
    fn beverage_ml(&self) -> f64 {
        if self.is_mix() && self.phase != 0 { self.scored_beverage }
        else { (self.liquid + self.foam_liquid).min(self.capacity) }
    }
    fn first_beverage_ml(&self) -> f64 {
        if !self.is_mix() { self.beverage_ml() }
        else if self.phase != 0 { self.scored_first_beverage }
        else { self.first_liquid + self.first_foam_liquid }
    }
    fn mix_accuracy(&self) -> f64 {
        if !self.is_mix() { return 100.0; }
        let total = self.beverage_ml();
        if total <= 0.001 { return 0.0; }
        (100.0 - 200.0 * (self.first_beverage_ml() / total - self.first_share).abs()).clamp(0.0, 100.0)
    }
    fn mix_stars(&self) -> u32 {
        let score = self.mix_accuracy();
        if score >= 96.0 { 5 } else if score >= 88.0 { 4 }
            else if score >= 72.0 { 3 } else if score >= 50.0 { 2 } else { 1 }
    }
    fn patience_limit(&self) -> f64 {
        8.0 + self.prep_allowance + 2.0 * self.order_awning as f64 + self.active_patio as f64
            + if self.active_helper { 1.5 } else { 0.0 }
    }
    fn patience(&self) -> f64 { (1.0 - self.elapsed / self.patience_limit()).clamp(0.0, 1.0) }
    fn speed_tip(&self) -> u32 {
        (65.0 * ((self.patience_limit() - self.elapsed) / (self.patience_limit() - 2.0)).clamp(0.0, 1.0)).round() as u32
    }
    fn menu_price(&self) -> u32 {
        let prices = [0.65, 0.75, 0.8, 0.9];
        let unit = if self.is_mix() { prices[self.soda] * self.first_share + prices[self.second_soda] * (1.0 - self.first_share) } else { prices[self.soda] };
        (110.0 + self.capacity * self.target * unit).round() as u32 + self.recipe_premium()
    }
    fn recipe_premium(&self) -> u32 {
        self.ordered_cherries * 40 + self.ordered_lime * 35 + self.ordered_syrup * 50
            + if self.ordered_blend != 1 { 25 } else { 0 }
            + if self.is_mix() { 60 } else { 0 }
    }
    fn addin_cost(&self) -> u32 { self.selected_cherries * 8 + self.selected_lime * 10 + self.selected_syrup * 12 }
    fn recipe_accuracy(&self) -> u32 {
        100u32.saturating_sub(if self.selected_soda == self.soda { 0 } else { 60 })
            .saturating_sub(15 * self.selected_cherries.abs_diff(self.ordered_cherries))
            .saturating_sub(20 * self.selected_lime.abs_diff(self.ordered_lime))
            .saturating_sub(20 * self.selected_syrup.abs_diff(self.ordered_syrup))
            .saturating_sub(20 * self.selected_blend.abs_diff(self.ordered_blend) as u32)
    }
    fn recipe_mistakes(&self) -> u32 {
        (self.selected_soda != self.soda) as u32
            | ((self.selected_cherries != self.ordered_cherries) as u32) << 1
            | ((self.selected_lime != self.ordered_lime) as u32) << 2
            | ((self.selected_syrup != self.ordered_syrup) as u32) << 3
            | ((self.selected_blend != self.ordered_blend) as u32) << 4
    }
    fn fill_stars(&self) -> u32 {
        if self.accuracy >= 96.0 { 5 } else if self.accuracy >= 88.0 { 4 }
            else if self.accuracy >= 72.0 { 3 } else if self.accuracy >= 50.0 { 2 } else { 1 }
    }
    fn sign_multiplier(&self) -> f64 { 1.0 + 0.08 * self.order_sign as f64 }

    fn tick(&mut self, dt: f64, pouring: bool) {
        if self.phase == 0 && (self.attempted || self.prep_started) { self.elapsed = (self.elapsed + dt).min(1_000_000.0); }
        if self.is_mix() { self.tick_mix(dt, pouring); return; }
        let soda = self.actual_soda();
        if pouring {
            let incoming = self.flow() * dt;
            self.poured += incoming;
            let trapped = incoming * ENTRAINED[soda];
            self.liquid += incoming - trapped;
            self.foam_liquid += trapped;
            let expansion = 1.0 + (EXPANSION[soda] - 1.0)
                * self.foam_multiplier() * PRESSURE_GAS[self.pressure] * self.recipe_fizz() * self.ice_fizz();
            self.foam += trapped * expansion;
        }
        let decay = (SETTLE_RATES[soda] * dt).min(1.0);
        let recovered = self.foam_liquid * decay;
        self.liquid += recovered;
        self.foam_liquid -= recovered;
        self.foam *= 1.0 - decay;
        if self.foam < 0.005 {
            self.liquid += self.foam_liquid; self.foam_liquid = 0.0; self.foam = 0.0;
        }
        let excess = (self.liquid + self.foam - self.capacity).max(0.0);
        if excess > 0.0 {
            let foam_spill = excess.min(self.foam);
            let lost_beverage = if self.foam > 0.0 { self.foam_liquid * foam_spill / self.foam } else { 0.0 };
            self.foam_liquid -= lost_beverage;
            self.foam -= foam_spill;
            let liquid_spill = (excess - foam_spill).min(self.liquid);
            self.liquid -= liquid_spill;
            self.spill += foam_spill + liquid_spill;
            self.beverage_waste += lost_beverage + liquid_spill;
        }
    }

    /// Keep each soda's own foam/recovery pool. Overflow removes proportionate
    /// shares of foam beverage first, then liquid, so spilling cannot preserve
    /// a fictitious first-soda amount or turn gas into a scored ingredient.
    fn tick_mix(&mut self, dt: f64, pouring: bool) {
        let mut liquids = [self.first_liquid, (self.liquid - self.first_liquid).max(0.0)];
        let mut foams = [self.first_foam, (self.foam - self.first_foam).max(0.0)];
        let mut trapped = [self.first_foam_liquid, (self.foam_liquid - self.first_foam_liquid).max(0.0)];
        let sodas = [self.first_soda(), self.second_soda];
        if pouring {
            let part = self.pour_part as usize;
            let incoming = self.flow() * dt;
            self.poured += incoming;
            if part == 0 { self.first_poured += incoming; }
            let beverage = incoming * ENTRAINED[sodas[part]];
            liquids[part] += incoming - beverage; trapped[part] += beverage;
            foams[part] += beverage * (1.0 + (EXPANSION[sodas[part]] - 1.0)
                * self.foam_multiplier() * PRESSURE_GAS[self.pressure] * self.recipe_fizz() * self.ice_fizz());
        }
        for part in 0..2 {
            let decay = (SETTLE_RATES[sodas[part]] * dt).min(1.0);
            let recovered = trapped[part] * decay;
            liquids[part] += recovered; trapped[part] -= recovered; foams[part] *= 1.0 - decay;
            if foams[part] < 0.005 { liquids[part] += trapped[part]; trapped[part] = 0.0; foams[part] = 0.0; }
        }
        let total_foam = foams[0] + foams[1];
        let total_liquid = liquids[0] + liquids[1];
        let excess = (total_liquid + total_foam - self.capacity).max(0.0);
        if excess > 0.0 {
            let foam_spill = excess.min(total_foam);
            let liquid_spill = (excess - foam_spill).min(total_liquid);
            let foam_fraction = if total_foam > 0.0 { foam_spill / total_foam } else { 0.0 };
            let liquid_fraction = if total_liquid > 0.0 { liquid_spill / total_liquid } else { 0.0 };
            let lost_beverage = (trapped[0] + trapped[1]) * foam_fraction;
            for part in 0..2 {
                foams[part] *= 1.0 - foam_fraction; trapped[part] *= 1.0 - foam_fraction;
                liquids[part] *= 1.0 - liquid_fraction;
            }
            self.spill += foam_spill + liquid_spill;
            self.beverage_waste += lost_beverage + liquid_spill;
        }
        self.first_liquid = liquids[0]; self.first_foam = foams[0]; self.first_foam_liquid = trapped[0];
        self.liquid = liquids[0] + liquids[1]; self.foam = foams[0] + foams[1];
        self.foam_liquid = trapped[0] + trapped[1];
    }

    pub fn serve(&mut self) -> bool {
        if self.phase != 0 || self.hardcore || !self.part_attempted { return false; }
        self.holding = false; self.complete_part(); true
    }

    fn combo(&self) -> f64 {
        match self.streak { 0..=1 => 1.0, 2 => 1.1, 3..=4 => 1.2, 5..=7 => 1.3,
            8..=11 => 1.45, 12..=15 => 1.6, 16..=23 => 1.75, _ => 1.9 }
    }
    fn milestone(streak: u32) -> u32 {
        match streak { 3 => 75, 5 => 125, 8 => 200, 12 => 300, 16 => 400,
            n if n >= 20 && n % 4 == 0 => 500, _ => 0 }
    }
    fn next_milestone(&self) -> u32 {
        [3, 5, 8, 12, 16].into_iter().find(|n| *n > self.streak)
            .unwrap_or_else(|| (self.streak / 4 + 1).saturating_mul(4))
    }
    fn mode_multiplier(&self) -> f64 { if self.hardcore { 1.15 } else { 1.0 } }
    fn credit(&mut self, cents: u32) {
        self.cash = add_money(self.cash, cents);
        self.shift_gross = add_money(self.shift_gross, cents);
        self.lifetime_gross = add_money(self.lifetime_gross, cents);
    }
    /// Supplies and cleanup never create debt or spend reserved payroll. A broke
    /// shop can still serve its next customer; a good pour funds its own supplies.
    fn charge_operating(&mut self, cents: u32) -> u32 {
        let charged = cents.min(self.spendable());
        self.cash -= charged; charged
    }

    fn score(&mut self) {
        if self.phase != 0 { return; }
        self.scored_beverage = self.beverage_ml(); self.scored_first_beverage = self.first_beverage_ml();
        self.last_hardcore = self.hardcore;
        let error = (self.beverage_ml() / self.capacity - self.target).abs();
        self.accuracy = (100.0 - 350.0 * error).clamp(0.0, 100.0);
        let recipe_stars = match self.recipe_accuracy() { 100 => 5, 80..=99 => 4, 60..=79 => 3, 40..=59 => 2, _ => 1 };
        self.stars = self.fill_stars().min(recipe_stars).min(self.mix_stars());
        self.last_was_good = self.stars >= 4;
        self.streak = if self.last_was_good { self.streak.saturating_add(1).min(MAX_COUNT) } else { 0 };
        self.best_streak = self.best_streak.max(self.streak);
        if self.hardcore { self.hard_best = self.hard_best.max(self.streak); }
        else { self.easy_best = self.easy_best.max(self.streak); }
        let full_price = self.menu_price() as f64 * self.multiplier * self.sign_multiplier() * self.mode_multiplier();
        let quality = if self.accuracy < 35.0 || self.beverage_ml() < 5.0 { 0.0 }
            else { match self.stars { 1 => 0.2, 2 => 0.5, 3 => 0.82, 4 => 0.96, _ => 1.0 } };
        let late_factor = (1.0 - (self.elapsed - self.patience_limit()).max(0.0) * 0.04).max(0.65);
        self.last_base = (full_price * quality * late_factor).round() as u32;
        self.last_refund = (full_price.round() as u32).saturating_sub(self.last_base);
        self.last_combo = (self.last_base as f64 * (self.combo() - 1.0)).round() as u32;
        self.last_milestone = Self::milestone(self.streak);
        self.last_perfect_tip = if self.stars == 5 { 25 } else { 0 };
        self.last_service_tip = if self.stars >= 4 {
            self.speed_tip() + 10 * self.order_awning + if self.active_helper { 30 } else { 0 }
        } else { 0 };
        // No rewards on poor grades. Regulars build trust over repeat visits,
        // while the daily chalkboard special pays for at most three cups.
        self.last_regular_tip = 0; self.last_special_tip = 0;
        let patron = self.regular_id();
        if patron < self.loyalty.len() {
            if self.stars >= 4 {
                let before = self.loyalty[patron];
                self.loyalty[patron] = (before + 1).min(5);
                self.last_regular_tip = 20 + 10 * before
                    + if before == 4 { 80 } else { 0 };
            } else { self.loyalty[patron] = self.loyalty[patron].saturating_sub(1); }
        }
        if self.stars >= 4 && self.soda == self.special_soda() && self.special_hits < 3 {
            self.special_hits += 1;
            self.last_special_tip = if self.special_hits == 3 { 150 } else { 25 };
        }
        self.shift_regular_tips = add_money(self.shift_regular_tips, self.last_regular_tip);
        self.shift_special_tips = add_money(self.shift_special_tips, self.last_special_tip);
        self.payout = self.last_base + self.last_combo + self.last_milestone + self.last_perfect_tip
            + self.last_service_tip + self.last_regular_tip + self.last_special_tip;
        self.credit(self.payout);
        let unit_costs = [0.10, 0.12, 0.13, 0.16];
        let liquid_cost = if self.is_mix() { self.first_poured * unit_costs[self.first_soda()]
            + (self.poured - self.first_poured).max(0.0) * unit_costs[self.second_soda] }
            else { self.poured * unit_costs[self.actual_soda()] };
        let ingredients = self.addin_cost() + if self.poured > 0.001 {
            (15.0 + liquid_cost * BLEND_COST[self.selected_blend]).ceil() as u32
        } else { 0 };
        let work = (self.spill / self.capacity * 5.0).min(2.5);
        self.cleanup_seconds = work * if self.active_helper { 0.5 } else { 1.0 };
        self.cleanup_saved += work - self.cleanup_seconds;
        let cleanup = (self.spill.min(self.capacity * 2.0) * 0.25
            * (1.0 - 0.15 * self.upgrades[3] as f64)
            * if self.active_helper { 0.5 } else { 1.0 }).ceil() as u32;
        self.last_ingredient = self.charge_operating(ingredients);
        self.last_cleanup = self.charge_operating(cleanup);
        self.last_net = self.payout as i64 - self.last_ingredient as i64 - self.last_cleanup as i64;
        self.shift_ingredients = add_money(self.shift_ingredients, self.last_ingredient);
        self.shift_cleanup = add_money(self.shift_cleanup, self.last_cleanup);
        self.shift_refunds = add_money(self.shift_refunds, self.last_refund);
        let no_sign = (self.last_base as f64 / self.sign_multiplier()).round() as u32;
        self.shift_sign = add_money(self.shift_sign, self.last_base.saturating_sub(no_sign));
        self.shift_service = add_money(self.shift_service, self.last_service_tip);
        self.previous_rating = self.rating;
        self.rating = (0.68 * self.rating + 0.32 * self.stars as f64).clamp(1.0, 5.0);
        self.completed += 1;
        self.lifetime_customers = self.lifetime_customers.saturating_add(1).min(MAX_COUNT);
        self.accuracy_sum += self.accuracy;
        if self.stars == 5 { self.perfect += 1; self.lifetime_perfect = self.lifetime_perfect.saturating_add(1).min(MAX_COUNT); }
        // Business time is earned by actually making a cup, capped per customer:
        // waiting cannot farm unlimited staff income and menus add no work time.
        if self.active_specialist && self.poured >= 5.0 {
            self.staff_work += self.elapsed.min(10.0);
            let cycle = 3.5 / (1.0 + 0.2 * self.active_training as f64);
            while self.staff_work >= cycle && self.staff_orders < self.staff_capacity && self.queued_demand > 0 {
                self.staff_work -= cycle; self.serve_staff_order();
            }
        }
        if self.elapsed > self.patience_limit() + 2.0 && self.queued_demand > 0 {
            self.queued_demand -= 1; self.missed_customers += 1;
        }
        self.phase = 1; self.refresh();
    }

    fn serve_staff_order(&mut self) {
        let base = 270.0 * (0.6 + 0.2 * self.rating)
            * (1.0 + 0.08 * self.upgrades[0] as f64)
            * (1.0 + 0.12 * self.active_catering as f64 + 0.06 * self.active_training as f64);
        let sale = base.round() as u32;
        self.credit(sale); self.staff_sales = add_money(self.staff_sales, sale);
        let costs = self.charge_operating(55);
        self.shift_ingredients = add_money(self.shift_ingredients, costs);
        self.staff_orders += 1; self.queued_demand -= 1;
        self.lifetime_customers = self.lifetime_customers.saturating_add(1).min(MAX_COUNT);
    }

    pub fn set_mode(&mut self, hardcore: bool) -> bool {
        if self.phase == 0 && self.attempted { return false; }
        if self.hardcore != hardcore { self.hardcore = hardcore; self.streak = 0; }
        self.refresh(); true
    }

    fn prepare_order(&mut self) {
        if self.resume_hardcore { self.hardcore = true; self.streak = 0; self.resume_hardcore = false; }
        self.order = self.completed + 1;
        self.soda = ((self.completed + self.day - 1) % 4) as usize;
        self.cup = (self.random() % 4) as usize;
        self.capacity = CAPACITIES[self.cup];
        let targets = [0.45, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80];
        self.target = targets[(self.random() % targets.len() as u32) as usize];
        self.liquid = 0.0; self.foam = 0.0; self.foam_liquid = 0.0; self.spill = 0.0;
        self.beverage_waste = 0.0; self.poured = 0.0; self.elapsed = 0.0;
        self.cleanup_seconds = 0.0; self.attempted = false; self.holding = false;
        self.second_soda = 4; self.first_share = 1.0; self.pour_part = 0; self.part_attempted = false;
        self.first_liquid = 0.0; self.first_foam = 0.0; self.first_foam_liquid = 0.0; self.first_poured = 0.0;
        self.scored_beverage = 0.0; self.scored_first_beverage = 0.0;
        self.multiplier = 0.6 + self.rating * 0.2;
        self.order_sign = self.upgrades[0]; self.order_awning = self.upgrades[2]; self.phase = 0;
        self.prepare_recipe();
    }

    fn prepare_recipe(&mut self) {
        self.ordered_cherries = 0; self.ordered_lime = 0; self.ordered_syrup = 0; self.ordered_blend = 1;
        let serial = (self.day - 1).saturating_mul(12).saturating_add(self.completed);
        let roll = self.random();
        // A plain order periodically gives players a breather. Calls consume one
        // RNG value regardless of unlocks, pressure, or difficulty.
        if roll % 4 != 0 {
            let mut choices = [0usize; 3]; let mut len = 1;
            if serial >= 3 && self.upgrades[9] > 0 { choices[len] = 1; len += 1; }
            if serial >= 3 && self.upgrades[10] > 0 { choices[len] = 2; len += 1; }
            let first = ((roll >> 2) as usize) % len;
            let count = if serial >= 5 && roll & 32 != 0 { 2 } else { 1 };
            self.order_addin(choices[first], count);
            if serial >= 8 && len > 1 && roll & 64 != 0 {
                self.order_addin(choices[(first + 1 + ((roll >> 7) as usize % (len - 1))) % len], 1);
            }
            if serial >= 5 && self.upgrades[11] > 0 { self.ordered_blend = ((roll >> 10) % 3) as usize; }
        }
        // Customer six introduces an even mix. Later mixes use the same recipe
        // RNG draw, keeping cup/target generation independent of mode/equipment.
        if serial == 5 || (serial > 5 && roll % 3 == 0) {
            self.second_soda = (self.soda + 1 + ((roll >> 14) % 3) as usize) % 4;
            self.first_share = if serial >= 12 { [0.25, 0.5, 0.75][((roll >> 12) % 3) as usize] } else { 0.5 };
            self.ordered_blend = 1;
            if self.ordered_cherries > 0 {
                self.ordered_cherries = 1; self.ordered_lime = 0; self.ordered_syrup = 0;
            } else if self.ordered_lime > 0 { self.ordered_syrup = 0; }
            else if self.ordered_syrup > 0 { self.ordered_syrup = 1; }
        }
        self.selected_soda = if self.is_mix() { self.soda } else { 4 };
        self.selected_cherries = 0; self.selected_lime = 0;
        self.selected_syrup = 0; self.selected_blend = 1; self.selected_ice = 0; self.prep_started = false;
        self.prep_allowance = 2.0 + 1.5 * (self.ordered_cherries + self.ordered_lime + self.ordered_syrup
            + (self.ordered_blend != 1) as u32) as f64 + if self.is_mix() { 2.0 } else { 0.0 };
    }
    fn order_addin(&mut self, kind: usize, amount: u32) {
        match kind { 0 => self.ordered_cherries = amount, 1 => self.ordered_lime = 1, _ => self.ordered_syrup = amount }
    }

    pub fn next_order(&mut self) {
        if self.phase != 1 { return; }
        if self.completed >= self.goal { self.close_day(); } else { self.prepare_order(); }
        self.refresh();
    }
    fn wages_due(&self) -> u32 {
        if self.day_closed { 0 } else { (if self.active_helper { 150 } else { 0 }) + (if self.active_specialist { 250 } else { 0 }) }
    }
    fn close_day(&mut self) {
        if self.day_closed { return; }
        self.missed_customers = self.missed_customers.saturating_add(self.queued_demand);
        self.queued_demand = 0;
        self.wages_paid = self.wages_due().min(self.cash); self.cash -= self.wages_paid;
        self.best_shift_gross = self.best_shift_gross.max(self.shift_gross);
        self.day_closed = true; self.phase = 2;
    }

    pub fn next_day(&mut self, seed: u32) -> bool {
        if self.phase != 2 || !self.day_closed || self.day >= MAX_COUNT { return false; }
        self.day += 1; self.rng = nonzero_seed(seed); self.goal = 12;
        self.active_helper = self.upgrades[4] > 0; self.active_specialist = self.upgrades[5] > 0;
        self.active_patio = self.upgrades[1]; self.active_interior = self.upgrades[6];
        self.active_catering = self.upgrades[7]; self.active_training = self.upgrades[8];
        self.staff_capacity = if self.active_specialist { 3 + 2 * self.active_patio + 4 * self.active_interior + 2 * self.active_training } else { 0 };
        self.queued_demand = 2 + 2 * self.upgrades[0] + 3 * self.active_patio + 4 * self.active_interior + 8 * self.active_catering;
        self.day_closed = false; self.completed = 0; self.accuracy_sum = 0.0; self.perfect = 0;
        self.shift_gross = 0; self.staff_sales = 0; self.wages_paid = 0; self.accuracy = 0.0;
        self.stars = 0; self.payout = 0; self.last_base = 0; self.last_combo = 0;
        self.last_milestone = 0; self.last_perfect_tip = 0; self.last_service_tip = 0;
        self.last_was_good = false; self.last_ingredient = 0; self.last_cleanup = 0;
        self.last_refund = 0; self.last_net = 0; self.shift_ingredients = 0;
        self.shift_cleanup = 0; self.shift_refunds = 0; self.shift_sign = 0;
        self.shift_service = 0; self.staff_orders = 0; self.missed_customers = 0;
        self.special_hits = 0; self.last_regular_tip = 0; self.last_special_tip = 0;
        self.shift_regular_tips = 0; self.shift_special_tips = 0;
        self.cleanup_saved = 0.0; self.staff_work = 0.0;
        self.prepare_order(); self.refresh(); true
    }

    fn may_buy(&self) -> bool { self.phase != 0 || !self.attempted }
    fn spendable(&self) -> u32 { self.cash.saturating_sub(self.wages_due()) }
    fn cost(&self, item: usize) -> u32 {
        if item >= UPGRADE_MAX.len() || self.upgrades[item] >= UPGRADE_MAX[item] { 0 }
        else { COSTS[item][self.upgrades[item] as usize] }
    }
    pub fn buy(&mut self, item: usize) -> bool {
        let cost = self.cost(item);
        if !self.may_buy() || cost == 0 || self.spendable() < cost { return false; }
        if item == 7 && (self.upgrades[6] == 0 || self.upgrades[5] == 0) { return false; }
        if item == 8 && self.upgrades[5] == 0 { return false; }
        self.cash -= cost; self.upgrades[item] += 1;
        if self.phase == 0 { self.order_sign = self.upgrades[0]; self.order_awning = self.upgrades[2]; }
        self.refresh(); true
    }

    fn refresh(&mut self) {
        self.snapshot = [
            self.phase as f32, self.order as f32, self.soda as f32, self.cup as f32,
            self.target as f32, self.capacity as f32, self.liquid as f32, self.foam as f32,
            self.spill as f32, self.rating as f32, self.shift_gross as f32, self.accuracy as f32,
            self.stars as f32, self.payout as f32, self.multiplier as f32, self.elapsed as f32,
            self.completed as f32, if self.completed > 0 { (self.accuracy_sum / self.completed as f64) as f32 } else { 0.0 },
            self.perfect as f32, self.flow() as f32, self.cash as f32, self.hardcore as u32 as f32,
            self.attempted as u32 as f32, self.holding as u32 as f32, self.day as f32, self.goal as f32,
            self.streak as f32, self.best_streak as f32, self.combo() as f32, self.last_combo as f32,
            self.last_milestone as f32, self.last_perfect_tip as f32, self.last_service_tip as f32,
            self.lifetime_gross as f32, self.upgrades[0] as f32, self.upgrades[1] as f32,
            self.upgrades[2] as f32, self.upgrades[3] as f32, self.upgrades[4] as f32, self.upgrades[5] as f32,
            self.cost(0) as f32, self.cost(1) as f32, self.cost(2) as f32, self.cost(3) as f32,
            self.cost(4) as f32, self.cost(5) as f32, self.may_buy() as u32 as f32, self.spendable() as f32,
            self.wages_due() as f32, self.staff_sales as f32, self.wages_paid as f32,
            self.active_helper as u32 as f32, self.active_specialist as u32 as f32,
            self.lifetime_customers as f32, self.last_base as f32,
            (if self.phase == 0 { self.mode_multiplier() } else if self.last_hardcore { 1.15 } else { 1.0 }) as f32,
            self.sign_multiplier() as f32, self.foam_multiplier() as f32, self.last_was_good as u32 as f32,
            (self.shift_gross as i64 - self.wages_paid as i64 - self.shift_ingredients as i64 - self.shift_cleanup as i64) as f32,
            self.lifetime_perfect as f32, self.best_shift_gross as f32,
            (1 + self.upgrades.iter().sum::<u32>()) as f32, self.previous_rating as f32,
            self.beverage_ml() as f32, self.pressure as f32, self.beverage_waste as f32,
            self.cleanup_seconds as f32, self.patience() as f32, self.patience_limit() as f32,
            self.menu_price() as f32, self.last_ingredient as f32, self.last_cleanup as f32,
            self.last_refund as f32, self.last_net as f32, self.shift_ingredients as f32,
            self.shift_cleanup as f32, self.shift_refunds as f32, self.shift_sign as f32,
            self.shift_service as f32, self.staff_orders as f32, self.staff_capacity as f32,
            self.queued_demand as f32, self.missed_customers as f32, self.upgrades[6] as f32,
            self.upgrades[7] as f32, self.cost(6) as f32, self.cost(7) as f32,
            self.next_milestone() as f32, Self::milestone(self.next_milestone()) as f32,
            self.hard_best as f32, self.easy_best as f32, self.cleanup_saved as f32,
            self.upgrades[8] as f32, self.cost(8) as f32,
            (1 + self.upgrades[6] + if self.upgrades[7] > 0 { 1 } else { 0 }) as f32,
            (self.phase == 0 && !self.attempted) as u32 as f32, self.speed_tip() as f32,
            self.ordered_cherries as f32, self.ordered_lime as f32, self.ordered_syrup as f32, self.ordered_blend as f32,
            self.selected_soda as f32, self.selected_cherries as f32, self.selected_lime as f32,
            self.selected_syrup as f32, self.selected_blend as f32, self.recipe_accuracy() as f32,
            (self.phase != 0 || self.attempted) as u32 as f32,
            (self.phase == 0 && !self.attempted) as u32 as f32,
            self.upgrades[9] as f32, self.upgrades[10] as f32, self.upgrades[11] as f32,
            self.cost(9) as f32, self.cost(10) as f32, self.cost(11) as f32,
            self.recipe_premium() as f32, self.addin_cost() as f32, self.prep_started as u32 as f32,
            self.recipe_fizz() as f32, self.fill_stars() as f32, self.recipe_mistakes() as f32,
            self.prep_allowance as f32, (self.recipe_premium() > 0) as u32 as f32,
            self.second_soda as f32, self.first_share as f32, self.pour_part as f32,
            self.part_attempted as u32 as f32, self.actual_soda() as f32, self.active_target() as f32,
            self.first_beverage_ml() as f32, self.mix_accuracy() as f32, self.mix_stars() as f32,
            self.is_mix() as u32 as f32, self.selected_ice as f32, self.ice_fizz() as f32,
            self.regular_id() as f32,
            (if self.regular_id() < 4 { self.loyalty[self.regular_id()] } else { 0 }) as f32,
            self.special_soda() as f32, self.special_hits as f32,
            self.last_regular_tip as f32, self.last_special_tip as f32,
            self.shift_regular_tips as f32, self.shift_special_tips as f32,
            self.loyalty[0] as f32, self.loyalty[1] as f32,
            self.loyalty[2] as f32, self.loyalty[3] as f32,
        ];
    }
    pub fn state(&self) -> &[f32; SNAPSHOT_LEN] { &self.snapshot }

    /// V107 appends regular relationships and special bonuses to reserved slots106..114.
    /// Restore consumes only the interrupted Hardcore part. Paid cups stay paid.
    pub fn save(&self) -> [f64; SAVE_LEN] {
        let active = self.phase == 0;
        let mut s = [0.0; SAVE_LEN];
        let data = [
            SAVE_VERSION, self.phase as f64, self.order as f64, self.soda as f64,
            self.cup as f64, self.target, if active { self.liquid } else { self.beverage_ml() },
            if active { self.foam } else { 0.0 }, if active { self.foam_liquid } else { 0.0 },
            self.spill, self.rating, self.shift_gross as f64, self.accuracy, self.stars as f64,
            self.payout as f64, self.multiplier, self.elapsed, self.completed as f64,
            self.accuracy_sum, self.perfect as f64, self.rng as f64, self.cash as f64,
            self.hardcore as u32 as f64, self.attempted as u32 as f64, 0.0,
            self.day as f64, self.goal as f64, self.streak as f64, self.best_streak as f64,
            self.last_combo as f64, self.last_milestone as f64, self.last_perfect_tip as f64,
            self.last_service_tip as f64, self.lifetime_gross as f64,
            self.upgrades[0] as f64, self.upgrades[1] as f64, self.upgrades[2] as f64,
            self.upgrades[3] as f64, self.upgrades[4] as f64, self.upgrades[5] as f64,
            self.active_helper as u32 as f64, self.active_specialist as u32 as f64,
            self.staff_sales as f64, self.wages_paid as f64, self.day_closed as u32 as f64,
            self.lifetime_customers as f64, self.last_base as f64, self.lifetime_perfect as f64,
            self.best_shift_gross as f64, self.previous_rating, self.last_was_good as u32 as f64,
            self.order_sign as f64, self.order_awning as f64,
            self.pressure as f64, self.beverage_waste, self.poured, self.cleanup_seconds,
            self.last_ingredient as f64, self.last_cleanup as f64, self.last_refund as f64,
            self.last_net as f64, self.shift_ingredients as f64, self.shift_cleanup as f64,
            self.shift_refunds as f64, self.shift_sign as f64, self.shift_service as f64,
            self.staff_orders as f64, self.staff_capacity as f64, self.queued_demand as f64,
            self.missed_customers as f64, self.upgrades[6] as f64, self.upgrades[7] as f64,
            self.upgrades[8] as f64, self.hard_best as f64, self.easy_best as f64,
            self.cleanup_saved, self.staff_work, self.active_patio as f64,
            self.active_interior as f64, self.active_catering as f64, self.active_training as f64,
            self.last_hardcore as u32 as f64, self.resume_hardcore as u32 as f64,
            self.ordered_cherries as f64, self.ordered_lime as f64, self.ordered_syrup as f64,
            self.ordered_blend as f64, self.selected_soda as f64, self.selected_cherries as f64,
            self.selected_lime as f64, self.selected_syrup as f64, self.selected_blend as f64,
            self.prep_started as u32 as f64, self.upgrades[9] as f64, self.upgrades[10] as f64,
            self.upgrades[11] as f64, self.prep_allowance,
            self.second_soda as f64, self.first_share, self.pour_part as f64, self.part_attempted as u32 as f64,
            if self.is_mix() { if active { self.first_liquid } else { self.first_beverage_ml() } } else { 0.0 },
            if active { self.first_foam } else { 0.0 }, if active { self.first_foam_liquid } else { 0.0 },
            self.first_poured, self.selected_ice as f64,
            self.loyalty[0] as f64, self.loyalty[1] as f64,
            self.loyalty[2] as f64, self.loyalty[3] as f64,
            self.special_hits as f64, self.last_regular_tip as f64,
            self.last_special_tip as f64, self.shift_regular_tips as f64,
            self.shift_special_tips as f64,
        ];
        s[..data.len()].copy_from_slice(&data); s
    }

    pub fn restore(s: &[f64; SAVE_LEN]) -> Option<Self> {
        let legacy = s[0] == 101.0;
        let v102 = s[0] == 102.0;
        let v103 = s[0] == 103.0;
        let v104 = s[0] == 104.0;
        let v106 = s[0] == 106.0;
        if s.iter().any(|v| !v.is_finite()) || (!legacy && !v102 && !v103 && !v104 && !v106 && s[0] != SAVE_VERSION) { return None; }
        let integer = |i: usize, min: u32, max: u32| {
            s[i] >= min as f64 && s[i] <= max as f64 && s[i].fract() == 0.0
        };
        if !integer(1, 0, 2) || !integer(2, 1, 16) || !integer(3, 0, 3) || !integer(4, 0, 3)
            || !(0.40..=0.85).contains(&s[5]) || !(1.0..=5.0).contains(&s[10])
            || !(0.8..=1.600000001).contains(&s[15]) || !(0.0..=100.0).contains(&s[12])
            || !(0.0..=1_000_000.0).contains(&s[16]) || !(1.0..=5.0).contains(&s[49]) { return None; }
        for i in [11, 14, 21, 29, 30, 31, 32, 33, 42, 43, 46, 48] { if !integer(i, 0, MAX_CENTS) { return None; } }
        for i in [22, 23, 24, 40, 41, 44, 50] { if !integer(i, 0, 1) { return None; } }
        for i in [27, 28, 45, 47] { if !integer(i, 0, MAX_COUNT) { return None; } }
        if !integer(13, 0, 5) || !integer(17, 0, 16) || !integer(19, 0, 16)
            || !integer(20, 1, u32::MAX) || !integer(25, 1, MAX_COUNT)
            || !integer(26, 12, 16) || (s[26] as u32) % 2 != 0 { return None; }
        for (i, max) in UPGRADE_MAX[..6].iter().enumerate() { if !integer(34 + i, 0, *max) { return None; } }
        if !integer(51, 0, 3) || !integer(52, 0, 2) { return None; }
        let capacity = CAPACITIES[s[4] as usize];
        if !(0.0..=capacity).contains(&s[6]) || !(0.0..=capacity).contains(&s[7])
            || !(0.0..=s[7]).contains(&s[8]) || s[6] + s[7] > capacity + 1e-5
            || !(0.0..=1e9).contains(&s[9]) || s[24] != 0.0
            || s[2] > s[26] || s[17] > s[26] || s[19] > s[17]
            || s[18] < 0.0 || s[18] > 100.0 * s[17] + 1e-7
            || s[27] > s[28] || s[28] > s[45] || s[47] > s[45]
            || s[45] < s[17] || s[47] < s[19] || s[40] > s[38] || s[41] > s[39]
            || s[51] > s[34] || s[52] > s[36] || s[33] < s[11] || s[21] > s[33]
            || s[43] > 150.0 * s[40] + 250.0 * s[41] { return None; }
        let phase = s[1] as u32;
        if phase == 0 && (s[17] + 1.0 != s[2] || s[44] != 0.0) { return None; }
        if phase == 0 && s[23] == 0.0 && (s[6] != 0.0 || s[7] != 0.0 || s[8] != 0.0 || s[9] != 0.0
            || (s[16] != 0.0 && (legacy || v102 || s[92] != 1.0))) { return None; }
        if phase == 1 && (s[17] != s[2] || s[23] != 1.0 || s[44] != 0.0) { return None; }
        if phase == 2 && (s[17] != s[26] || s[2] != s[26] || s[44] != 1.0 || s[23] != 1.0) { return None; }
        if phase != 2 && s[43] != 0.0 { return None; }
        if phase != 0 && (s[13] == 0.0 || s[7] != 0.0 || s[8] != 0.0) { return None; }
        if legacy {
            if s[7] != 0.0 || s[8] != 0.0 || s[53..].iter().any(|v| *v != 0.0)
                || s[26] > 12.0 + 2.0 * s[35] || (phase != 2 && s[42] != 0.0)
                || (phase == 0 && s[23] != 0.0) { return None; }
        } else {
            if !integer(53, 0, 2) || !(0.0..=1e9).contains(&s[54]) || !(0.0..=1e9).contains(&s[55])
                || !(0.0..=2.5).contains(&s[56]) || !(-1e9..=1e9).contains(&s[60]) || s[60].fract() != 0.0
                || !(0.0..=1e6).contains(&s[75]) || !(0.0..=160.0).contains(&s[76])
                || !integer(81, 0, 1) || !integer(82, 0, 1)
                || (v102 && s[83..].iter().any(|v| *v != 0.0)) { return None; }
            for i in [57, 58, 59, 61, 62, 63, 64, 65] { if !integer(i, 0, MAX_CENTS) { return None; } }
            for i in [66, 67, 68, 69] { if !integer(i, 0, 64) { return None; } }
            for i in [70, 71, 72, 78, 79, 80] { if !integer(i, 0, 3) { return None; } }
            if !integer(77, 0, 2) || !integer(73, 0, MAX_COUNT) || !integer(74, 0, MAX_COUNT)
                || s[66] > s[67] || s[77] > s[35] || s[78] > s[70] || s[79] > s[71]
                || s[80] > s[72] || s[73] > s[28] || s[74] > s[28]
                || s[54] > s[55] + 1e-5 || s[6] + s[8] + s[54] > s[55] + 1e-4
                || (phase == 0 && s[23] == 0.0 && (s[54] != 0.0 || s[55] != 0.0)) { return None; }
        }
        if !legacy && !v102 {
            for i in [83, 85, 86, 91] { if !integer(i, 0, 2) { return None; } }
            for i in [84, 92, 93, 94, 95] { if !integer(i, 0, 1) { return None; } }
            // Historical V103/V104 garnishes keep their original limits.
            let newer = v106 || s[0] == SAVE_VERSION;
            if !integer(88, 0, if newer { 5 } else { 2 })
                || !integer(89, 0, if newer { 5 } else { 1 })
                || !integer(90, 0, if newer { 5 } else { 2 }) { return None; }
            if !integer(87, 0, 4) || !(0.0..=11.0).contains(&s[96])
                || (v103 && s[97..].iter().any(|v| *v != 0.0))
                || (v104 && s[105..].iter().any(|v| *v != 0.0))
                || (!v103 && !v104 && (!integer(105, 0, 5)
                    || (v106 && s[106..].iter().any(|v| *v != 0.0))
                    || (!v106 && s[115..].iter().any(|v| *v != 0.0))))
                || (!v103 && !v104 && s[105] > 0.0 && s[92] != 1.0)
                || (s[93] == 0.0 && (s[84] > 0.0 || s[89] > 0.0))
                || (s[94] == 0.0 && (s[85] > 0.0 || s[90] > 0.0))
                || (s[95] == 0.0 && (s[86] != 1.0 || s[91] != 1.0))
                || (s[23] == 1.0 && (s[87] == 4.0 || s[92] != 1.0))
                || ((s[83] > 0.0) as u32 + (s[84] > 0.0) as u32 + (s[85] > 0.0) as u32 > 2) { return None; }
        }
        if !legacy && !v102 && !v103 {
            if !integer(97, 0, 4) || !integer(99, 0, 1) || !integer(100, 0, 1)
                || !(0.0..=s[6] + 1e-7).contains(&s[101])
                || !(0.0..=s[7] + 1e-7).contains(&s[102])
                || !(0.0..=s[8] + 1e-7).contains(&s[103])
                || !(0.0..=s[55] + 1e-7).contains(&s[104])
                || s[103] > s[102] + 1e-7 || s[8] - s[103] > s[7] - s[102] + 1e-7
                || s[101] + s[103] > s[104] + 1e-5
                || s[6] + s[8] - s[101] - s[103] > s[55] - s[104] + 1e-5 { return None; }
            if s[97] == 4.0 {
                if s[98] != 1.0 || s[99] != 0.0 || s[100] != s[23]
                    || s[101..=104].iter().any(|v| *v != 0.0) { return None; }
            } else {
                if s[97] == s[3] || ![0.25, 0.5, 0.75].contains(&s[98])
                    || s[83] + s[84] + s[85] > 1.0 || s[86] != 1.0
                    || (s[99] == 0.0 && (phase != 0 || s[100] != s[23]))
                    || (s[99] == 1.0 && s[23] != 1.0)
                    || (phase != 0 && (s[99] != 1.0 || s[100] != 1.0)) { return None; }
                // Before the second attempt, every retained/poured drop must
                // still belong to the first part. An empty first hold is legal.
                if s[99] == 0.0 || s[100] == 0.0 {
                    if (s[101] - s[6]).abs() > 1e-7 || (s[102] - s[7]).abs() > 1e-7
                        || (s[103] - s[8]).abs() > 1e-7 || (s[104] - s[55]).abs() > 1e-7 { return None; }
                }
            }
        }
        // Existing V106 businesses migrate without a reset or retroactive tip.
        // V107 validates the complete new extension before restoring anything.
        if s[0] == SAVE_VERSION {
            for i in 106..110 { if !integer(i, 0, 5) { return None; } }
            if !integer(110, 0, 3) || !integer(111, 0, 200) || !integer(112, 0, 150)
                || !integer(113, 0, 2400) || !integer(114, 0, 200) { return None; }
            if s[114] < s[112] || s[113] < s[111] { return None; }
        }
        let mut g = Self::empty();
        if v106 || s[0] == SAVE_VERSION { g.selected_ice = s[105] as u32; }
        if s[0] == SAVE_VERSION {
            for i in 0..4 { g.loyalty[i] = s[106 + i] as u32; }
            g.special_hits = s[110] as u32;
            g.last_regular_tip = s[111] as u32; g.last_special_tip = s[112] as u32;
            g.shift_regular_tips = s[113] as u32; g.shift_special_tips = s[114] as u32;
        }
        g.phase = phase; g.order = s[2] as u32; g.soda = s[3] as usize; g.cup = s[4] as usize;
        g.target = s[5]; g.capacity = capacity; g.liquid = s[6]; g.foam = s[7]; g.foam_liquid = s[8];
        g.spill = s[9]; g.rating = s[10]; g.shift_gross = s[11] as u32; g.accuracy = s[12];
        g.stars = s[13] as u32; g.payout = s[14] as u32; g.multiplier = s[15]; g.elapsed = s[16];
        g.completed = s[17] as u32; g.accuracy_sum = s[18]; g.perfect = s[19] as u32;
        g.rng = s[20] as u32; g.cash = s[21] as u32; g.attempted = s[23] != 0.0; g.day = s[25] as u32;
        g.part_attempted = g.attempted;
        g.hardcore = !(phase == 0 && g.attempted && s[22] == 0.0);
        g.goal = s[26] as u32; g.streak = if s[22] == 1.0 || !g.hardcore { s[27] as u32 } else { 0 };
        g.best_streak = s[28] as u32; g.last_combo = s[29] as u32; g.last_milestone = s[30] as u32;
        g.last_perfect_tip = s[31] as u32; g.last_service_tip = s[32] as u32; g.lifetime_gross = s[33] as u32;
        for i in 0..6 { g.upgrades[i] = s[34 + i] as u32; }
        g.active_helper = s[40] != 0.0; g.active_specialist = s[41] != 0.0; g.staff_sales = s[42] as u32;
        g.wages_paid = s[43] as u32; g.day_closed = s[44] != 0.0; g.lifetime_customers = s[45] as u32;
        g.last_base = s[46] as u32; g.lifetime_perfect = s[47] as u32; g.best_shift_gross = s[48] as u32;
        g.previous_rating = s[49]; g.last_was_good = s[50] != 0.0; g.order_sign = s[51] as u32; g.order_awning = s[52] as u32;
        if legacy {
            g.last_hardcore = s[22] == 1.0; g.last_net = g.payout as i64; g.poured = g.beverage_ml(); g.active_patio = ((s[26] as u32).saturating_sub(12)) / 2;
            g.staff_orders = if phase == 2 && g.active_specialist && g.staff_sales > 0 { 2 } else { 0 };
            g.staff_capacity = if g.active_specialist { 3 + 2 * g.active_patio } else { 0 };
            g.queued_demand = if phase == 2 { 0 } else { 2 + 2 * g.upgrades[0] + 3 * g.active_patio };
            if s[22] == 1.0 { g.hard_best = g.best_streak; } else { g.easy_best = g.best_streak; }
        } else {
            g.pressure = s[53] as usize; g.beverage_waste = s[54]; g.poured = s[55]; g.cleanup_seconds = s[56];
            g.last_ingredient = s[57] as u32; g.last_cleanup = s[58] as u32; g.last_refund = s[59] as u32;
            g.last_net = s[60] as i64; g.shift_ingredients = s[61] as u32; g.shift_cleanup = s[62] as u32;
            g.shift_refunds = s[63] as u32; g.shift_sign = s[64] as u32; g.shift_service = s[65] as u32;
            g.staff_orders = s[66] as u32; g.staff_capacity = s[67] as u32; g.queued_demand = s[68] as u32;
            g.missed_customers = s[69] as u32; g.upgrades[6] = s[70] as u32; g.upgrades[7] = s[71] as u32;
            g.upgrades[8] = s[72] as u32; g.hard_best = s[73] as u32; g.easy_best = s[74] as u32;
            g.cleanup_saved = s[75]; g.staff_work = s[76]; g.active_patio = s[77] as u32;
            g.active_interior = s[78] as u32; g.active_catering = s[79] as u32; g.active_training = s[80] as u32;
            g.last_hardcore = s[81] == 1.0; g.resume_hardcore = s[82] == 1.0 || !g.hardcore;
        }
        if legacy || v102 {
            // The current old-format order stays exactly as it was. Custom
            // requests begin with the next customer, without retroactive costs.
            g.ordered_cherries = 0; g.ordered_lime = 0; g.ordered_syrup = 0; g.ordered_blend = 1;
            g.selected_soda = g.soda; g.selected_cherries = 0; g.selected_lime = 0;
            g.selected_syrup = 0; g.selected_blend = 1; g.prep_started = g.attempted; g.prep_allowance = 0.0;
        } else {
            g.ordered_cherries = s[83] as u32; g.ordered_lime = s[84] as u32; g.ordered_syrup = s[85] as u32;
            g.ordered_blend = s[86] as usize; g.selected_soda = s[87] as usize; g.selected_cherries = s[88] as u32;
            g.selected_lime = s[89] as u32; g.selected_syrup = s[90] as u32; g.selected_blend = s[91] as usize;
            g.prep_started = s[92] == 1.0; g.upgrades[9] = s[93] as u32; g.upgrades[10] = s[94] as u32;
            g.upgrades[11] = s[95] as u32; g.prep_allowance = s[96];
        }
        if !legacy && !v102 && !v103 {
            g.second_soda = s[97] as usize; g.first_share = s[98]; g.pour_part = s[99] as u32;
            g.part_attempted = s[100] != 0.0; g.first_liquid = s[101]; g.first_foam = s[102];
            g.first_foam_liquid = s[103]; g.first_poured = s[104];
            // Paid saves canonically contain settled beverage. These receipt
            // amounts remain fixed even while live foam animates after payment.
            if phase != 0 { g.scored_beverage = s[6]; g.scored_first_beverage = s[101]; }
        }
        if !legacy && !v102 && phase != 0 {
            let recipe_stars = match g.recipe_accuracy() { 100 => 5, 80..=99 => 4, 60..=79 => 3, 40..=59 => 2, _ => 1 };
            if g.stars != g.fill_stars().min(recipe_stars).min(g.mix_stars()) { return None; }
        }
        if !legacy && g.phase == 0 && g.part_attempted && g.hardcore { g.complete_part(); }
        g.refresh(); Some(g)
    }
}

fn nonzero_seed(seed: u32) -> u32 { if seed == 0 { 0x6D2B79F5 } else { seed } }
fn add_money(a: u32, b: u32) -> u32 { a.saturating_add(b).min(MAX_CENTS) }
static mut GAME: Game = Game::empty();
static mut SAVE: [f64; SAVE_LEN] = [0.0; SAVE_LEN];
#[no_mangle]
pub extern "C" fn reset(seed: u32) { unsafe { core::ptr::addr_of_mut!(GAME).write(Game::new(seed)); } }
#[no_mangle]
pub extern "C" fn begin_pour() -> u32 { unsafe { (*core::ptr::addr_of_mut!(GAME)).begin_pour() as u32 } }
#[no_mangle]
pub extern "C" fn end_pour() { unsafe { (*core::ptr::addr_of_mut!(GAME)).end_pour(); } }
#[no_mangle]
pub extern "C" fn step(dt: f32, _legacy_pouring: u32) { unsafe { (*core::ptr::addr_of_mut!(GAME)).step(dt); } }
#[no_mangle]
pub extern "C" fn serve() -> u32 { unsafe { (*core::ptr::addr_of_mut!(GAME)).serve() as u32 } }
#[no_mangle]
pub extern "C" fn set_mode(hardcore: u32) -> u32 {
    if hardcore > 1 { return 0; } unsafe { (*core::ptr::addr_of_mut!(GAME)).set_mode(hardcore != 0) as u32 }
}
#[no_mangle]
pub extern "C" fn set_pressure(pressure: u32) -> u32 { unsafe { (*core::ptr::addr_of_mut!(GAME)).set_pressure(pressure as usize) as u32 } }
#[no_mangle]
pub extern "C" fn set_ice(scoops: u32) -> u32 { unsafe { (*core::ptr::addr_of_mut!(GAME)).set_ice(scoops) as u32 } }
#[no_mangle]
pub extern "C" fn set_recipe(soda: u32, cherries: u32, lime: u32, syrup: u32, blend: u32) -> u32 {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).set_recipe(soda as usize, cherries, lime, syrup, blend as usize) as u32 }
}
#[no_mangle]
pub extern "C" fn next_order() { unsafe { (*core::ptr::addr_of_mut!(GAME)).next_order(); } }
#[no_mangle]
pub extern "C" fn next_day(seed: u32) -> u32 { unsafe { (*core::ptr::addr_of_mut!(GAME)).next_day(seed) as u32 } }
#[no_mangle]
pub extern "C" fn buy(item: u32) -> u32 { unsafe { (*core::ptr::addr_of_mut!(GAME)).buy(item as usize) as u32 } }
#[no_mangle]
pub extern "C" fn state_ptr() -> *const f32 { unsafe { core::ptr::addr_of!(GAME.snapshot).cast::<f32>() } }
#[no_mangle]
pub extern "C" fn state_len() -> u32 { SNAPSHOT_LEN as u32 }
#[no_mangle]
pub extern "C" fn save_ptr() -> *mut f64 {
    unsafe { core::ptr::addr_of_mut!(SAVE).write((*core::ptr::addr_of!(GAME)).save()); core::ptr::addr_of_mut!(SAVE).cast::<f64>() }
}
#[no_mangle]
pub extern "C" fn save_len() -> u32 { SAVE_LEN as u32 }
#[no_mangle]
pub extern "C" fn restore_save() -> u32 {
    unsafe {
        if let Some(game) = Game::restore(&*core::ptr::addr_of!(SAVE)) { core::ptr::addr_of_mut!(GAME).write(game); 1 } else { 0 }
    }
}
#[cfg(test)]
mod tests;
