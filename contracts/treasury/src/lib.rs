#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, symbol_short, token, Address, Env, String,
    Symbol,
};

#[contract]
pub struct Treasury;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InsufficientBalance = 4,
    InvalidAmount = 5,
    FeeTypeUnknown = 6,
    TokenNotSet = 7,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FeeConfig {
    pub registration_fee: i128,
    pub relationship_fee: i128,
    pub review_fee: i128,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct TreasuryStats {
    pub balance: i128,
    pub total_deposited: i128,
    pub total_withdrawn: i128,
    pub fee_events: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Initialized,
    Balance,
    TotalDeposited,
    TotalWithdrawn,
    FeeEvents,
    FeeConfig,
    Authorized(Address),
    /// Optional Stellar Asset Contract used for real token custody.
    Token,
    FeeCollector,
}

#[contractimpl]
impl Treasury {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::FeeCollector, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::Balance, &0i128);
        env.storage().instance().set(&DataKey::TotalDeposited, &0i128);
        env.storage().instance().set(&DataKey::TotalWithdrawn, &0i128);
        env.storage().instance().set(&DataKey::FeeEvents, &0u64);
        env.storage().instance().set(
            &DataKey::FeeConfig,
            &FeeConfig {
                registration_fee: 10_000_000,
                relationship_fee: 5_000_000,
                review_fee: 1_000_000,
            },
        );
        env.storage().instance().extend_ttl(100_000, 100_000);
        Ok(())
    }

    /// Bind a Stellar Asset Contract for real token deposits / fee collection / withdrawals.
    pub fn set_token(env: Env, token_addr: Address) -> Result<(), Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage().instance().set(&DataKey::Token, &token_addr);
        Ok(())
    }

    pub fn set_fee_collector(env: Env, collector: Address) -> Result<(), Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::FeeCollector, &collector);
        Ok(())
    }

    pub fn set_authorized(env: Env, caller: Address, authorized: bool) -> Result<(), Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        env.storage()
            .instance()
            .set(&DataKey::Authorized(caller), &authorized);
        Ok(())
    }

    pub fn set_fees(
        env: Env,
        registration_fee: i128,
        relationship_fee: i128,
        review_fee: i128,
    ) -> Result<(), Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        if registration_fee < 0 || relationship_fee < 0 || review_fee < 0 {
            return Err(Error::InvalidAmount);
        }
        env.storage().instance().set(
            &DataKey::FeeConfig,
            &FeeConfig {
                registration_fee,
                relationship_fee,
                review_fee,
            },
        );
        Ok(())
    }

    /// Record a platform fee. When a token is configured, pulls `amount` from `payer`
    /// into this contract via SAC transfer; otherwise ledger accounting only.
    pub fn record_fee(
        env: Env,
        caller: Address,
        payer: Address,
        fee_type: String,
        amount: i128,
    ) -> Result<i128, Error> {
        Self::require_init(&env)?;
        Self::require_authorized(&env, &caller)?;
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        if let Some(token_addr) = Self::token_opt(&env) {
            payer.require_auth();
            let client = token::Client::new(&env, &token_addr);
            client.transfer(&payer, &env.current_contract_address(), &amount);
        }

        let balance = Self::bump_deposit(&env, amount);
        let mut events: u64 = env.storage().instance().get(&DataKey::FeeEvents).unwrap();
        events += 1;
        env.storage().instance().set(&DataKey::FeeEvents, &events);

        env.events().publish(
            (symbol_short!("fee_paid"), fee_type.clone()),
            (payer, amount, balance),
        );
        Ok(balance)
    }

    /// Deposit funds. With a configured SAC, transfers tokens into treasury custody.
    pub fn deposit(env: Env, from: Address, amount: i128) -> Result<i128, Error> {
        Self::require_init(&env)?;
        from.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }

        if let Some(token_addr) = Self::token_opt(&env) {
            let client = token::Client::new(&env, &token_addr);
            client.transfer(&from, &env.current_contract_address(), &amount);
        }

        let balance = Self::bump_deposit(&env, amount);
        env.events().publish(
            (Symbol::new(&env, "TreasuryDeposit"), from),
            (amount, balance),
        );
        Ok(balance)
    }

    /// Admin withdraw. With a configured SAC, transfers tokens out of treasury custody.
    pub fn withdraw(env: Env, to: Address, amount: i128) -> Result<i128, Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut balance: i128 = env.storage().instance().get(&DataKey::Balance).unwrap();
        if balance < amount {
            return Err(Error::InsufficientBalance);
        }

        if let Some(token_addr) = Self::token_opt(&env) {
            let client = token::Client::new(&env, &token_addr);
            client.transfer(&env.current_contract_address(), &to, &amount);
        }

        let mut withdrawn: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalWithdrawn)
            .unwrap();
        balance -= amount;
        withdrawn += amount;
        env.storage().instance().set(&DataKey::Balance, &balance);
        env.storage()
            .instance()
            .set(&DataKey::TotalWithdrawn, &withdrawn);

        env.events().publish(
            (Symbol::new(&env, "TreasuryWithdraw"), to),
            (amount, balance),
        );
        Ok(balance)
    }

    /// Skim protocol fees to the fee collector while keeping net in treasury (token mode).
    pub fn skim_fees(env: Env, amount: i128) -> Result<i128, Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();
        if amount <= 0 {
            return Err(Error::InvalidAmount);
        }
        let mut balance: i128 = env.storage().instance().get(&DataKey::Balance).unwrap();
        if balance < amount {
            return Err(Error::InsufficientBalance);
        }
        let token_addr = Self::token_opt(&env).ok_or(Error::TokenNotSet)?;
        let collector: Address = env.storage().instance().get(&DataKey::FeeCollector).unwrap();
        let client = token::Client::new(&env, &token_addr);
        client.transfer(&env.current_contract_address(), &collector, &amount);

        balance -= amount;
        let mut withdrawn: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalWithdrawn)
            .unwrap();
        withdrawn += amount;
        env.storage().instance().set(&DataKey::Balance, &balance);
        env.storage()
            .instance()
            .set(&DataKey::TotalWithdrawn, &withdrawn);

        env.events().publish(
            (Symbol::new(&env, "FeeSkim"), collector),
            (amount, balance),
        );
        Ok(balance)
    }

    pub fn get_fees(env: Env) -> Result<FeeConfig, Error> {
        Self::require_init(&env)?;
        Ok(env.storage().instance().get(&DataKey::FeeConfig).unwrap())
    }

    pub fn get_stats(env: Env) -> Result<TreasuryStats, Error> {
        Self::require_init(&env)?;
        Ok(TreasuryStats {
            balance: env.storage().instance().get(&DataKey::Balance).unwrap(),
            total_deposited: env
                .storage()
                .instance()
                .get(&DataKey::TotalDeposited)
                .unwrap(),
            total_withdrawn: env
                .storage()
                .instance()
                .get(&DataKey::TotalWithdrawn)
                .unwrap(),
            fee_events: env.storage().instance().get(&DataKey::FeeEvents).unwrap(),
        })
    }

    pub fn get_balance(env: Env) -> Result<i128, Error> {
        Self::require_init(&env)?;
        Ok(env.storage().instance().get(&DataKey::Balance).unwrap())
    }

    pub fn get_token(env: Env) -> Option<Address> {
        Self::token_opt(&env)
    }

    fn token_opt(env: &Env) -> Option<Address> {
        env.storage().instance().get(&DataKey::Token)
    }

    fn bump_deposit(env: &Env, amount: i128) -> i128 {
        let mut balance: i128 = env.storage().instance().get(&DataKey::Balance).unwrap();
        let mut deposited: i128 = env
            .storage()
            .instance()
            .get(&DataKey::TotalDeposited)
            .unwrap();
        balance += amount;
        deposited += amount;
        env.storage().instance().set(&DataKey::Balance, &balance);
        env.storage()
            .instance()
            .set(&DataKey::TotalDeposited, &deposited);
        balance
    }

    fn require_init(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }

    fn require_authorized(env: &Env, caller: &Address) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        if caller == &admin {
            caller.require_auth();
            return Ok(());
        }
        let authorized: bool = env
            .storage()
            .instance()
            .get(&DataKey::Authorized(caller.clone()))
            .unwrap_or(false);
        if !authorized {
            return Err(Error::Unauthorized);
        }
        caller.require_auth();
        Ok(())
    }
}

mod test;
