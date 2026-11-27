//! Perfect Pour V1.01: deterministic, dependency-free gameplay and business rules.
//! The browser renders a 65-float snapshot; this module owns every scored action.

const SNAPSHOT_LEN: usize = 65;
const SAVE_LEN: usize = 80;
const SAVE_VERSION: f64 = 101.0;
const MAX_CENTS: u32 = 1_000_000_000;
const MAX_COUNT: u32 = 1_000_000;
const CAPACITIES: [f64; 4] = [280.0, 360.0, 460.0, 330.0];
const RATES: [f64; 4] = [104.0, 94.0, 110.0, 98.0];
const ENTRAINED: [f64; 4] = [0.065, 0.105, 0.145, 0.18];
const EXPANSION: [f64; 4] = [5.0, 6.0, 7.0, 8.0];
const SETTLE_RATES: [f64; 4] = [1.8, 1.55, 1.3, 1.1];
const UPGRADE_MAX: [u32; 6] = [3, 2, 2, 2, 1, 1];
const COSTS: [[u32; 3]; 6] = [
    [1200, 2200, 3600], [1800, 3000, 0], [1600, 2800, 0],
    [2400, 4200, 0], [3500, 0, 0], [5500, 0, 0],
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
    last_service_tip: u32, lifetime_gross: u32, upgrades: [u32; 6],
    active_helper: bool, active_specialist: bool, staff_sales: u32,
    wages_paid: u32, day_closed: bool, lifetime_customers: u32,
    last_base: u32, lifetime_perfect: u32, best_shift_gross: u32,
    previous_rating: f64, last_was_good: bool, order_sign: u32,
    order_awning: u32, snapshot: [f32; SNAPSHOT_LEN],
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
            lifetime_gross: 0, upgrades: [0; 6], active_helper: false,
            active_specialist: false, staff_sales: 0, wages_paid: 0,
            day_closed: false, lifetime_customers: 0, last_base: 0,
            lifetime_perfect: 0, best_shift_gross: 0, previous_rating: 3.5,
            last_was_good: false, order_sign: 0, order_awning: 0,
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
        x ^= x << 13;
        x ^= x >> 17;
        x ^= x << 5;
        self.rng = x;
        x
    }

    pub fn begin_pour(&mut self) -> bool {
        if self.phase != 0 || self.holding || (self.hardcore && self.attempted) {
            return false;
        }
        self.attempted = true;
        self.holding = true;
        self.refresh();
        true
    }

    pub fn end_pour(&mut self) {
        if self.phase != 0 || !self.holding { return; }
        self.holding = false;
        if self.hardcore { self.score(); } else { self.refresh(); }
    }

    /// A bounded, fixed substep keeps physics stable across render frame rates.
    /// Pouring is owned by begin_pour/end_pour, never by the browser's frame flag.
    /// A paid review can only settle its existing foam; its result is final.
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

    fn foam_multiplier(&self) -> f64 { 1.0 - 0.2 * self.upgrades[3] as f64 }

    fn beverage_ml(&self) -> f64 { (self.liquid + self.foam_liquid).min(self.capacity) }

    fn tick(&mut self, dt: f64, pouring: bool) {
        if self.phase == 0 { self.elapsed += dt; }
        if pouring {
            let incoming = RATES[self.soda] * dt;
            let trapped = incoming * ENTRAINED[self.soda];
            self.liquid += incoming - trapped;
            self.foam_liquid += trapped;
            // Equipment reduces gas, not the amount of actual beverage.
            let expansion = 1.0 + (EXPANSION[self.soda] - 1.0) * self.foam_multiplier();
            self.foam += trapped * expansion;
        }
        let decay = (SETTLE_RATES[self.soda] * dt).min(1.0);
        let recovered = self.foam_liquid * decay;
        self.liquid += recovered;
        self.foam_liquid -= recovered;
        self.foam *= 1.0 - decay;
        if self.foam < 0.005 {
            self.liquid += self.foam_liquid;
            self.foam_liquid = 0.0;
            self.foam = 0.0;
        }
        let excess = (self.liquid + self.foam - self.capacity).max(0.0);
        if excess > 0.0 {
            let foam_spill = excess.min(self.foam);
            if self.foam > 0.0 {
                self.foam_liquid *= 1.0 - foam_spill / self.foam;
                self.foam -= foam_spill;
            }
            let liquid_spill = (excess - foam_spill).min(self.liquid);
            self.liquid -= liquid_spill;
            self.spill += foam_spill + liquid_spill;
        }
    }

    pub fn serve(&mut self) -> bool {
        if self.phase != 0 || self.hardcore || !self.attempted { return false; }
        self.holding = false;
        self.score();
        true
    }

    fn combo(&self) -> f64 {
        match self.streak { 0..=1 => 1.0, 2 => 1.1, 3..=4 => 1.2, 5..=6 => 1.3, _ => 1.4 }
    }

    fn mode_multiplier(&self) -> f64 { if self.hardcore { 1.15 } else { 1.0 } }

    fn credit(&mut self, cents: u32) {
        self.cash = add_money(self.cash, cents);
        self.shift_gross = add_money(self.shift_gross, cents);
        self.lifetime_gross = add_money(self.lifetime_gross, cents);
    }

    fn score(&mut self) {
        if self.phase != 0 { return; }
        // Count the soda trapped in foam without erasing the visible foam.
        // The paid cup may keep settling, but this score and payout are final.
        let error = (self.beverage_ml() / self.capacity - self.target).abs();
        self.accuracy = (100.0 - 350.0 * error - 200.0 * self.spill / self.capacity).clamp(0.0, 100.0);
        self.stars = if self.accuracy >= 96.0 { 5 } else if self.accuracy >= 88.0 { 4 }
            else if self.accuracy >= 72.0 { 3 } else if self.accuracy >= 50.0 { 2 } else { 1 };
        self.last_was_good = self.stars >= 4;
        self.streak = if self.last_was_good { self.streak.saturating_add(1).min(MAX_COUNT) } else { 0 };
        self.best_streak = self.best_streak.max(self.streak);
        self.last_base = (250.0 * self.multiplier * (1.0 + 0.05 * self.order_sign as f64)
            * self.mode_multiplier() * (0.4 + 0.006 * self.accuracy)).round() as u32;
        self.last_combo = (self.last_base as f64 * (self.combo() - 1.0)).round() as u32;
        self.last_milestone = match self.streak { 3 => 100, 5 => 200, 8 => 400, _ => 0 };
        self.last_perfect_tip = if self.stars == 5 { 25 } else { 0 };
        self.last_service_tip = (if self.stars >= 4 { 15 * self.order_awning } else { 0 })
            + (if self.active_helper && self.stars >= 3 { 35 } else { 0 });
        self.payout = self.last_base + self.last_combo + self.last_milestone
            + self.last_perfect_tip + self.last_service_tip;
        self.credit(self.payout);
        self.previous_rating = self.rating;
        self.rating = (0.68 * self.rating + 0.32 * self.stars as f64).clamp(1.0, 5.0);
        self.completed += 1;
        self.lifetime_customers = self.lifetime_customers.saturating_add(1).min(MAX_COUNT);
        self.accuracy_sum += self.accuracy;
        if self.stars == 5 {
            self.perfect += 1;
            self.lifetime_perfect = self.lifetime_perfect.saturating_add(1).min(MAX_COUNT);
        }
        self.phase = 1;
        self.refresh();
    }

    pub fn set_mode(&mut self, hardcore: bool) -> bool {
        if self.phase == 0 && self.attempted { return false; }
        if self.hardcore != hardcore {
            self.hardcore = hardcore;
            self.streak = 0;
        }
        self.refresh();
        true
    }

    fn prepare_order(&mut self) {
        self.order = self.completed + 1;
        self.soda = ((self.completed + self.day - 1) % 4) as usize;
        self.cup = (self.random() % 4) as usize;
        self.capacity = CAPACITIES[self.cup];
        let targets = [0.45, 0.55, 0.60, 0.65, 0.70, 0.75, 0.80];
        self.target = targets[(self.random() % targets.len() as u32) as usize];
        self.liquid = 0.0;
        self.foam = 0.0;
        self.foam_liquid = 0.0;
        self.spill = 0.0;
        self.elapsed = 0.0;
        self.attempted = false;
        self.holding = false;
        self.multiplier = 0.6 + self.rating * 0.2;
        self.order_sign = self.upgrades[0];
        self.order_awning = self.upgrades[2];
        self.phase = 0;
    }

    pub fn next_order(&mut self) {
        if self.phase != 1 { return; }
        if self.completed >= self.goal { self.close_day(); } else { self.prepare_order(); }
        self.refresh();
    }

    fn wages_due(&self) -> u32 {
        if self.day_closed { 0 } else {
            (if self.active_helper { 150 } else { 0 }) + (if self.active_specialist { 250 } else { 0 })
        }
    }

    fn close_day(&mut self) {
        if self.day_closed { return; }
        if self.active_specialist {
            self.staff_sales = (2.0 * 200.0 * (0.6 + 0.2 * self.rating)
                * (1.0 + 0.05 * self.upgrades[0] as f64)).round() as u32;
            self.credit(self.staff_sales);
            self.lifetime_customers = self.lifetime_customers.saturating_add(2).min(MAX_COUNT);
        }
        self.wages_paid = self.wages_due().min(self.cash);
        self.cash -= self.wages_paid;
        self.best_shift_gross = self.best_shift_gross.max(self.shift_gross);
        self.day_closed = true;
        self.phase = 2;
    }

    pub fn next_day(&mut self, seed: u32) -> bool {
        if self.phase != 2 || !self.day_closed || self.day >= MAX_COUNT { return false; }
        self.day += 1;
        self.rng = nonzero_seed(seed);
        self.goal = 12 + 2 * self.upgrades[1];
        self.active_helper = self.upgrades[4] > 0;
        self.active_specialist = self.upgrades[5] > 0;
        self.day_closed = false;
        self.completed = 0;
        self.accuracy_sum = 0.0;
        self.perfect = 0;
        self.shift_gross = 0;
        self.staff_sales = 0;
        self.wages_paid = 0;
        self.accuracy = 0.0;
        self.stars = 0;
        self.payout = 0;
        self.last_base = 0;
        self.last_combo = 0;
        self.last_milestone = 0;
        self.last_perfect_tip = 0;
        self.last_service_tip = 0;
        self.last_was_good = false;
        self.prepare_order();
        self.refresh();
        true
    }

    fn may_buy(&self) -> bool { self.phase != 0 || !self.attempted }
    fn spendable(&self) -> u32 { self.cash.saturating_sub(self.wages_due()) }
    fn cost(&self, item: usize) -> u32 {
        if item >= 6 || self.upgrades[item] >= UPGRADE_MAX[item] { 0 }
        else { COSTS[item][self.upgrades[item] as usize] }
    }

    pub fn buy(&mut self, item: usize) -> bool {
        let cost = self.cost(item);
        if !self.may_buy() || cost == 0 || self.spendable() < cost { return false; }
        self.cash -= cost;
        self.upgrades[item] += 1;
        if self.phase == 0 {
            self.order_sign = self.upgrades[0];
            self.order_awning = self.upgrades[2];
        }
        self.refresh();
        true
    }

    fn refresh(&mut self) {
        self.snapshot = [
            self.phase as f32, self.order as f32, self.soda as f32, self.cup as f32,
            self.target as f32, self.capacity as f32, self.liquid as f32, self.foam as f32,
            self.spill as f32, self.rating as f32, self.shift_gross as f32, self.accuracy as f32,
            self.stars as f32, self.payout as f32, self.multiplier as f32, self.elapsed as f32,
            self.completed as f32, if self.completed > 0 { (self.accuracy_sum / self.completed as f64) as f32 } else { 0.0 },
            self.perfect as f32, RATES[self.soda] as f32, self.cash as f32, self.hardcore as u32 as f32,
            self.attempted as u32 as f32, self.holding as u32 as f32, self.day as f32, self.goal as f32,
            self.streak as f32, self.best_streak as f32, self.combo() as f32, self.last_combo as f32,
            self.last_milestone as f32, self.last_perfect_tip as f32, self.last_service_tip as f32,
            self.lifetime_gross as f32, self.upgrades[0] as f32, self.upgrades[1] as f32,
            self.upgrades[2] as f32, self.upgrades[3] as f32, self.upgrades[4] as f32, self.upgrades[5] as f32,
            self.cost(0) as f32, self.cost(1) as f32, self.cost(2) as f32, self.cost(3) as f32,
            self.cost(4) as f32, self.cost(5) as f32, self.may_buy() as u32 as f32, self.spendable() as f32,
            self.wages_due() as f32, self.staff_sales as f32, self.wages_paid as f32,
            self.active_helper as u32 as f32, self.active_specialist as u32 as f32,
            self.lifetime_customers as f32, self.last_base as f32, self.mode_multiplier() as f32,
            (1.0 + 0.05 * self.order_sign as f64) as f32, self.foam_multiplier() as f32,
            self.last_was_good as u32 as f32, self.shift_gross.saturating_sub(self.wages_paid) as f32,
            self.lifetime_perfect as f32, self.best_shift_gross as f32,
            (1 + self.upgrades.iter().sum::<u32>()) as f32, self.previous_rating as f32,
            self.beverage_ml() as f32,
        ];
    }

    pub fn state(&self) -> &[f32; SNAPSHOT_LEN] { &self.snapshot }

    /// Unfinished cups become untouched checkpoints. Paid reviews keep their
    /// phase and payout, so reloading cannot award the same review twice. Save
    /// the paid cup's settled beverage to retain the version 101 checkpoint.
    pub fn save(&self) -> [f64; SAVE_LEN] {
        let active = self.phase == 0;
        let mut s = [0.0; SAVE_LEN];
        let data = [
            SAVE_VERSION, self.phase as f64, self.order as f64, self.soda as f64,
            self.cup as f64, self.target, if active { 0.0 } else { self.beverage_ml() }, 0.0, 0.0,
            if active { 0.0 } else { self.spill }, self.rating, self.shift_gross as f64,
            self.accuracy, self.stars as f64, self.payout as f64, self.multiplier,
            if active { 0.0 } else { self.elapsed }, self.completed as f64,
            self.accuracy_sum, self.perfect as f64, self.rng as f64, self.cash as f64,
            self.hardcore as u32 as f64, if active { 0.0 } else { self.attempted as u32 as f64 },
            0.0, self.day as f64, self.goal as f64, self.streak as f64, self.best_streak as f64,
            self.last_combo as f64, self.last_milestone as f64, self.last_perfect_tip as f64,
            self.last_service_tip as f64, self.lifetime_gross as f64,
            self.upgrades[0] as f64, self.upgrades[1] as f64, self.upgrades[2] as f64,
            self.upgrades[3] as f64, self.upgrades[4] as f64, self.upgrades[5] as f64,
            self.active_helper as u32 as f64, self.active_specialist as u32 as f64,
            self.staff_sales as f64, self.wages_paid as f64, self.day_closed as u32 as f64,
            self.lifetime_customers as f64, self.last_base as f64, self.lifetime_perfect as f64,
            self.best_shift_gross as f64, self.previous_rating, self.last_was_good as u32 as f64,
            self.order_sign as f64, self.order_awning as f64,
        ];
        s[..data.len()].copy_from_slice(&data);
        s
    }

    pub fn restore(s: &[f64; SAVE_LEN]) -> Option<Self> {
        if s.iter().any(|v| !v.is_finite()) || s[0] != SAVE_VERSION { return None; }
        let integer = |i: usize, min: u32, max: u32| {
            s[i] >= min as f64 && s[i] <= max as f64 && s[i].fract() == 0.0
        };
        if !integer(1, 0, 2) || !integer(2, 1, 16) || !integer(3, 0, 3)
            || !integer(4, 0, 3) || !(0.40..=0.85).contains(&s[5])
            || !(1.0..=5.0).contains(&s[10]) || !(0.8..=1.600000001).contains(&s[15])
            || !(0.0..=100.0).contains(&s[12]) || !(0.0..=1_000_000.0).contains(&s[16])
            || !(1.0..=5.0).contains(&s[49]) { return None; }
        for i in [11, 14, 21, 29, 30, 31, 32, 33, 42, 43, 46, 48] {
            if !integer(i, 0, MAX_CENTS) { return None; }
        }
        for i in [22, 23, 24, 40, 41, 44, 50] {
            if !integer(i, 0, 1) { return None; }
        }
        for i in [27, 28, 45, 47] { if !integer(i, 0, MAX_COUNT) { return None; } }
        if !integer(13, 0, 5) || !integer(17, 0, 16) || !integer(19, 0, 16)
            || !integer(20, 1, u32::MAX) || !integer(25, 1, MAX_COUNT)
            || !integer(26, 12, 16) || (s[26] as u32) % 2 != 0 { return None; }
        for (i, max) in UPGRADE_MAX.iter().enumerate() {
            if !integer(34 + i, 0, *max) { return None; }
        }
        if !integer(51, 0, 3) || !integer(52, 0, 2) { return None; }
        let capacity = CAPACITIES[s[4] as usize];
        if !(0.0..=capacity).contains(&s[6]) || !(0.0..=1e9).contains(&s[9])
            || s[7] != 0.0 || s[8] != 0.0 || s[24] != 0.0 || s[53..].iter().any(|v| *v != 0.0)
            || s[2] > s[26] || s[17] > s[26] || s[19] > s[17]
            || s[18] < 0.0 || s[18] > 100.0 * s[17] + 1e-7
            || s[27] > s[28] || s[28] > s[45] || s[47] > s[45]
            || s[45] < s[17] || s[47] < s[19] || s[40] > s[38] || s[41] > s[39]
            || s[51] > s[34] || s[52] > s[36] || s[26] > 12.0 + 2.0 * s[35]
            || s[33] < s[11] || s[21] > s[33]
            || s[43] > 150.0 * s[40] + 250.0 * s[41] { return None; }
        let phase = s[1] as u32;
        if phase == 0 && (s[17] + 1.0 != s[2] || s[23] != 0.0 || s[6] != 0.0
            || s[9] != 0.0 || s[16] != 0.0 || s[44] != 0.0) { return None; }
        if phase == 1 && (s[17] != s[2] || s[23] != 1.0 || s[44] != 0.0) { return None; }
        if phase == 2 && (s[17] != s[26] || s[2] != s[26] || s[44] != 1.0
            || s[23] != 1.0) { return None; }
        if phase != 2 && (s[42] != 0.0 || s[43] != 0.0) { return None; }
        if phase != 0 && s[13] == 0.0 { return None; }
        let mut g = Self::empty();
        g.phase = phase; g.order = s[2] as u32; g.soda = s[3] as usize;
        g.cup = s[4] as usize; g.target = s[5]; g.capacity = capacity;
        g.liquid = s[6]; g.spill = s[9]; g.rating = s[10];
        g.shift_gross = s[11] as u32; g.accuracy = s[12]; g.stars = s[13] as u32;
        g.payout = s[14] as u32; g.multiplier = s[15]; g.elapsed = s[16];
        g.completed = s[17] as u32; g.accuracy_sum = s[18]; g.perfect = s[19] as u32;
        g.rng = s[20] as u32; g.cash = s[21] as u32;
        g.hardcore = true; g.attempted = s[23] != 0.0; g.day = s[25] as u32;
        g.goal = s[26] as u32; g.streak = if s[22] == 1.0 { s[27] as u32 } else { 0 };
        g.best_streak = s[28] as u32; g.last_combo = s[29] as u32;
        g.last_milestone = s[30] as u32; g.last_perfect_tip = s[31] as u32;
        g.last_service_tip = s[32] as u32; g.lifetime_gross = s[33] as u32;
        for i in 0..6 { g.upgrades[i] = s[34 + i] as u32; }
        g.active_helper = s[40] != 0.0; g.active_specialist = s[41] != 0.0;
        g.staff_sales = s[42] as u32; g.wages_paid = s[43] as u32;
        g.day_closed = s[44] != 0.0; g.lifetime_customers = s[45] as u32;
        g.last_base = s[46] as u32; g.lifetime_perfect = s[47] as u32;
        g.best_shift_gross = s[48] as u32; g.previous_rating = s[49];
        g.last_was_good = s[50] != 0.0; g.order_sign = s[51] as u32;
        g.order_awning = s[52] as u32;
        g.refresh();
        Some(g)
    }
}

fn nonzero_seed(seed: u32) -> u32 { if seed == 0 { 0x6D2B79F5 } else { seed } }
fn add_money(a: u32, b: u32) -> u32 { a.saturating_add(b).min(MAX_CENTS) }

// The browser calls the single instance synchronously. Raw pointers keep the
// export boundary free of references to a static mut.
static mut GAME: Game = Game::empty();
static mut SAVE: [f64; SAVE_LEN] = [0.0; SAVE_LEN];

#[no_mangle]
pub extern "C" fn reset(seed: u32) {
    unsafe { core::ptr::addr_of_mut!(GAME).write(Game::new(seed)); }
}
#[no_mangle]
pub extern "C" fn begin_pour() -> u32 {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).begin_pour() as u32 }
}
#[no_mangle]
pub extern "C" fn end_pour() {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).end_pour(); }
}
#[no_mangle]
pub extern "C" fn step(dt: f32, _legacy_pouring: u32) {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).step(dt); }
}
#[no_mangle]
pub extern "C" fn serve() -> u32 {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).serve() as u32 }
}
#[no_mangle]
pub extern "C" fn set_mode(hardcore: u32) -> u32 {
    if hardcore > 1 { return 0; }
    unsafe { (*core::ptr::addr_of_mut!(GAME)).set_mode(hardcore != 0) as u32 }
}
#[no_mangle]
pub extern "C" fn next_order() {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).next_order(); }
}
#[no_mangle]
pub extern "C" fn next_day(seed: u32) -> u32 {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).next_day(seed) as u32 }
}
#[no_mangle]
pub extern "C" fn buy(item: u32) -> u32 {
    unsafe { (*core::ptr::addr_of_mut!(GAME)).buy(item as usize) as u32 }
}
#[no_mangle]
pub extern "C" fn state_ptr() -> *const f32 {
    unsafe { core::ptr::addr_of!(GAME.snapshot).cast::<f32>() }
}
#[no_mangle]
pub extern "C" fn state_len() -> u32 { SNAPSHOT_LEN as u32 }
#[no_mangle]
pub extern "C" fn save_ptr() -> *mut f64 {
    unsafe {
        core::ptr::addr_of_mut!(SAVE).write((*core::ptr::addr_of!(GAME)).save());
        core::ptr::addr_of_mut!(SAVE).cast::<f64>()
    }
}
#[no_mangle]
pub extern "C" fn save_len() -> u32 { SAVE_LEN as u32 }
#[no_mangle]
pub extern "C" fn restore_save() -> u32 {
    unsafe {
        if let Some(game) = Game::restore(&*core::ptr::addr_of!(SAVE)) {
            core::ptr::addr_of_mut!(GAME).write(game);
            1
        } else { 0 }
    }
}

#[cfg(test)]
mod tests;
