#![no_std]
use soroban_sdk::{
    contract, contracterror, contractimpl, contracttype, Address, Env, Symbol,
};

#[contract]
pub struct Reputation;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    InvalidRating = 4,
    OrgNotTracked = 5,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationScore {
    pub org_id: u64,
    pub trust_score: u32,
    pub completed_relationships: u32,
    pub verified_reviews: u32,
    pub average_rating_bps: u32,
    pub rating_sum: u32,
    pub disputes_opened: u32,
    pub disputes_lost: u32,
    pub last_updated: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Initialized,
    Score(u64),
    Authorized(Address),
}

#[contractimpl]
impl Reputation {
    pub fn initialize(env: Env, admin: Address) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().extend_ttl(100_000, 100_000);
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

    pub fn record_completed_relationship(
        env: Env,
        caller: Address,
        org_id: u64,
        quality_score: u32,
    ) -> Result<ReputationScore, Error> {
        Self::require_init(&env)?;
        Self::require_authorized(&env, &caller)?;
        if quality_score > 100 {
            return Err(Error::InvalidRating);
        }

        let mut score = Self::get_or_create(&env, org_id);
        score.completed_relationships += 1;
        // Boost trust by quality (capped later)
        let boost = 5 + (quality_score / 20);
        score.trust_score = score.trust_score.saturating_add(boost).min(1000);
        score.last_updated = env.ledger().timestamp();
        Self::persist(&env, &score);

        env.events().publish(
            (Symbol::new(&env, "ReputationUpdated"), org_id),
            (score.trust_score, score.completed_relationships),
        );
        env.events().publish(
            (Symbol::new(&env, "TrustScoreUpdated"), org_id),
            score.trust_score,
        );
        Ok(score)
    }

    pub fn record_verified_review(
        env: Env,
        caller: Address,
        org_id: u64,
        rating: u32,
    ) -> Result<ReputationScore, Error> {
        Self::require_init(&env)?;
        Self::require_authorized(&env, &caller)?;
        if rating < 1 || rating > 5 {
            return Err(Error::InvalidRating);
        }

        let mut score = Self::get_or_create(&env, org_id);
        score.verified_reviews += 1;
        score.rating_sum += rating;
        score.average_rating_bps = (score.rating_sum * 100) / score.verified_reviews;
        let rating_boost = rating * 3;
        score.trust_score = score.trust_score.saturating_add(rating_boost).min(1000);
        score.last_updated = env.ledger().timestamp();
        Self::persist(&env, &score);

        env.events().publish(
            (Symbol::new(&env, "ReputationUpdated"), org_id),
            (score.trust_score, score.average_rating_bps),
        );
        env.events().publish(
            (Symbol::new(&env, "TrustScoreUpdated"), org_id),
            score.trust_score,
        );
        Ok(score)
    }

    pub fn record_dispute(
        env: Env,
        caller: Address,
        org_id: u64,
        lost: bool,
    ) -> Result<ReputationScore, Error> {
        Self::require_init(&env)?;
        Self::require_authorized(&env, &caller)?;

        let mut score = Self::get_or_create(&env, org_id);
        score.disputes_opened += 1;
        if lost {
            score.disputes_lost += 1;
            score.trust_score = score.trust_score.saturating_sub(25);
        } else {
            // Neutral dispute resolution — small recovery
            score.trust_score = score.trust_score.saturating_add(2).min(1000);
        }
        score.last_updated = env.ledger().timestamp();
        Self::persist(&env, &score);

        env.events().publish(
            (Symbol::new(&env, "ReputationUpdated"), org_id),
            (score.trust_score, score.disputes_opened),
        );
        env.events().publish(
            (Symbol::new(&env, "TrustScoreUpdated"), org_id),
            score.trust_score,
        );
        Ok(score)
    }

    pub fn get_reputation(env: Env, org_id: u64) -> Result<ReputationScore, Error> {
        Self::require_init(&env)?;
        env.storage()
            .persistent()
            .get(&DataKey::Score(org_id))
            .ok_or(Error::OrgNotTracked)
    }

    pub fn get_trust_score(env: Env, org_id: u64) -> u32 {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return 0;
        }
        env.storage()
            .persistent()
            .get(&DataKey::Score(org_id))
            .map(|s: ReputationScore| s.trust_score)
            .unwrap_or(0)
    }

    pub fn ensure_tracked(env: Env, caller: Address, org_id: u64) -> Result<ReputationScore, Error> {
        Self::require_init(&env)?;
        Self::require_authorized(&env, &caller)?;
        let score = Self::get_or_create(&env, org_id);
        Self::persist(&env, &score);
        Ok(score)
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
        // Contract callers are authorized by identity; EOAs still need auth
        caller.require_auth();
        Ok(())
    }

    fn get_or_create(env: &Env, org_id: u64) -> ReputationScore {
        env.storage()
            .persistent()
            .get(&DataKey::Score(org_id))
            .unwrap_or(ReputationScore {
                org_id,
                trust_score: 100, // starting trust baseline
                completed_relationships: 0,
                verified_reviews: 0,
                average_rating_bps: 0,
                rating_sum: 0,
                disputes_opened: 0,
                disputes_lost: 0,
                last_updated: env.ledger().timestamp(),
            })
    }

    fn persist(env: &Env, score: &ReputationScore) {
        env.storage()
            .persistent()
            .set(&DataKey::Score(score.org_id), score);
    }
}

mod test;
