#![no_std]
use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, Env, String,
    Symbol,
};

#[contract]
pub struct TrustRelationship;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    NotFound = 4,
    InvalidState = 5,
    AlreadyAccepted = 6,
    DisputeExists = 7,
    NoDispute = 8,
    InvalidTitle = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum RelationshipStatus {
    Pending,
    Active,
    Completed,
    Disputed,
    Cancelled,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum DisputeOutcome {
    Pending,
    PartyAWins,
    PartyBWins,
    Mutual,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Relationship {
    pub id: u64,
    pub party_a: Address,
    pub party_b: Address,
    pub org_a: u64,
    pub org_b: u64,
    pub title: String,
    pub status: RelationshipStatus,
    pub a_accepted: bool,
    pub b_accepted: bool,
    pub a_completed: bool,
    pub b_completed: bool,
    pub created_at: u64,
    pub completed_at: u64,
    pub dispute_reason: String,
    pub dispute_outcome: DisputeOutcome,
    pub quality_score: u32,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Initialized,
    Factory,
    Reputation,
    NextId,
    Rel(u64),
    Total,
}

/// Client interface for Reputation contract (cross-contract calls).
#[contractclient(name = "ReputationClient")]
pub trait ReputationTrait {
    fn record_completed_relationship(
        env: Env,
        caller: Address,
        org_id: u64,
        quality_score: u32,
    ) -> ReputationScoreView;
    fn record_dispute(env: Env, caller: Address, org_id: u64, lost: bool) -> ReputationScoreView;
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct ReputationScoreView {
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

#[contractimpl]
impl TrustRelationship {
    pub fn initialize(
        env: Env,
        admin: Address,
        factory: Address,
        reputation: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Factory, &factory);
        env.storage()
            .instance()
            .set(&DataKey::Reputation, &reputation);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::NextId, &1u64);
        env.storage().instance().set(&DataKey::Total, &0u64);
        env.storage().instance().extend_ttl(100_000, 100_000);
        Ok(())
    }

    /// Called by the factory (or admin) to create a new relationship record.
    pub fn create(
        env: Env,
        caller: Address,
        party_a: Address,
        party_b: Address,
        org_a: u64,
        org_b: u64,
        title: String,
    ) -> Result<u64, Error> {
        Self::require_init(&env)?;
        Self::require_factory_or_admin(&env, &caller)?;

        if title.len() < 3 || title.len() > 128 {
            return Err(Error::InvalidTitle);
        }

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap();
        let rel = Relationship {
            id,
            party_a: party_a.clone(),
            party_b: party_b.clone(),
            org_a,
            org_b,
            title: title.clone(),
            status: RelationshipStatus::Pending,
            a_accepted: false,
            b_accepted: false,
            a_completed: false,
            b_completed: false,
            created_at: env.ledger().timestamp(),
            completed_at: 0,
            dispute_reason: String::from_str(&env, ""),
            dispute_outcome: DisputeOutcome::Pending,
            quality_score: 0,
        };

        env.storage().persistent().set(&DataKey::Rel(id), &rel);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        let total: u64 = env.storage().instance().get(&DataKey::Total).unwrap();
        env.storage().instance().set(&DataKey::Total, &(total + 1));

        env.events().publish(
            (Symbol::new(&env, "RelationshipCreated"), id),
            (party_a, party_b, org_a, org_b, title),
        );
        Ok(id)
    }

    pub fn accept(env: Env, actor: Address, relationship_id: u64) -> Result<Relationship, Error> {
        Self::require_init(&env)?;
        actor.require_auth();
        let mut rel = Self::load(&env, relationship_id)?;

        if rel.status != RelationshipStatus::Pending && rel.status != RelationshipStatus::Active {
            return Err(Error::InvalidState);
        }

        if actor == rel.party_a {
            if rel.a_accepted {
                return Err(Error::AlreadyAccepted);
            }
            rel.a_accepted = true;
        } else if actor == rel.party_b {
            if rel.b_accepted {
                return Err(Error::AlreadyAccepted);
            }
            rel.b_accepted = true;
        } else {
            return Err(Error::Unauthorized);
        }

        if rel.a_accepted && rel.b_accepted {
            rel.status = RelationshipStatus::Active;
        }

        env.storage()
            .persistent()
            .set(&DataKey::Rel(relationship_id), &rel);
        Ok(rel)
    }

    pub fn complete(
        env: Env,
        actor: Address,
        relationship_id: u64,
        quality_score: u32,
    ) -> Result<Relationship, Error> {
        Self::require_init(&env)?;
        actor.require_auth();
        let mut rel = Self::load(&env, relationship_id)?;

        if rel.status != RelationshipStatus::Active {
            return Err(Error::InvalidState);
        }
        if quality_score > 100 {
            return Err(Error::InvalidState);
        }

        if actor == rel.party_a {
            rel.a_completed = true;
        } else if actor == rel.party_b {
            rel.b_completed = true;
        } else {
            return Err(Error::Unauthorized);
        }

        // Keep the latest quality signal from either party
        if quality_score > rel.quality_score {
            rel.quality_score = quality_score;
        }

        if rel.a_completed && rel.b_completed {
            rel.status = RelationshipStatus::Completed;
            rel.completed_at = env.ledger().timestamp();

            let reputation: Address =
                env.storage().instance().get(&DataKey::Reputation).unwrap();
            let this_contract = env.current_contract_address();
            let client = ReputationClient::new(&env, &reputation);
            client.record_completed_relationship(&this_contract, &rel.org_a, &rel.quality_score);
            client.record_completed_relationship(&this_contract, &rel.org_b, &rel.quality_score);

            env.events().publish(
                (Symbol::new(&env, "RelationshipCompleted"), relationship_id),
                (rel.org_a, rel.org_b, rel.quality_score),
            );
        }

        env.storage()
            .persistent()
            .set(&DataKey::Rel(relationship_id), &rel);
        Ok(rel)
    }

    pub fn open_dispute(
        env: Env,
        actor: Address,
        relationship_id: u64,
        reason: String,
    ) -> Result<Relationship, Error> {
        Self::require_init(&env)?;
        actor.require_auth();
        let mut rel = Self::load(&env, relationship_id)?;

        if rel.status != RelationshipStatus::Active && rel.status != RelationshipStatus::Pending {
            return Err(Error::InvalidState);
        }
        if rel.status == RelationshipStatus::Disputed {
            return Err(Error::DisputeExists);
        }
        if actor != rel.party_a && actor != rel.party_b {
            return Err(Error::Unauthorized);
        }

        rel.status = RelationshipStatus::Disputed;
        rel.dispute_reason = reason.clone();
        env.storage()
            .persistent()
            .set(&DataKey::Rel(relationship_id), &rel);

        env.events().publish(
            (Symbol::new(&env, "DisputeOpened"), relationship_id),
            (actor, reason),
        );
        Ok(rel)
    }

    pub fn resolve_dispute(
        env: Env,
        relationship_id: u64,
        outcome: DisputeOutcome,
    ) -> Result<Relationship, Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut rel = Self::load(&env, relationship_id)?;
        if rel.status != RelationshipStatus::Disputed {
            return Err(Error::NoDispute);
        }
        if outcome == DisputeOutcome::Pending {
            return Err(Error::InvalidState);
        }

        rel.dispute_outcome = outcome.clone();
        rel.status = RelationshipStatus::Active;

        let reputation: Address = env.storage().instance().get(&DataKey::Reputation).unwrap();
        let this_contract = env.current_contract_address();
        let client = ReputationClient::new(&env, &reputation);

        match outcome {
            DisputeOutcome::PartyAWins => {
                client.record_dispute(&this_contract, &rel.org_b, &true);
                client.record_dispute(&this_contract, &rel.org_a, &false);
            }
            DisputeOutcome::PartyBWins => {
                client.record_dispute(&this_contract, &rel.org_a, &true);
                client.record_dispute(&this_contract, &rel.org_b, &false);
            }
            DisputeOutcome::Mutual => {
                client.record_dispute(&this_contract, &rel.org_a, &false);
                client.record_dispute(&this_contract, &rel.org_b, &false);
            }
            DisputeOutcome::Pending => {}
        }

        env.storage()
            .persistent()
            .set(&DataKey::Rel(relationship_id), &rel);

        env.events().publish(
            (Symbol::new(&env, "DisputeResolved"), relationship_id),
            outcome,
        );
        Ok(rel)
    }

    pub fn get_relationship(env: Env, relationship_id: u64) -> Result<Relationship, Error> {
        Self::require_init(&env)?;
        Self::load(&env, relationship_id)
    }

    pub fn total_relationships(env: Env) -> Result<u64, Error> {
        Self::require_init(&env)?;
        Ok(env.storage().instance().get(&DataKey::Total).unwrap())
    }

    fn require_init(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }

    fn require_factory_or_admin(env: &Env, caller: &Address) -> Result<(), Error> {
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        let factory: Address = env.storage().instance().get(&DataKey::Factory).unwrap();
        if caller == &admin || caller == &factory {
            caller.require_auth();
            return Ok(());
        }
        Err(Error::Unauthorized)
    }

    fn load(env: &Env, id: u64) -> Result<Relationship, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Rel(id))
            .ok_or(Error::NotFound)
    }
}

mod test;
