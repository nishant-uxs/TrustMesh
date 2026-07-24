#![no_std]
use soroban_sdk::{
    contract, contractclient, contracterror, contractimpl, contracttype, Address, Env, String,
    Symbol,
};

#[contract]
pub struct ReviewVerification;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
#[repr(u32)]
pub enum Error {
    AlreadyInitialized = 1,
    NotInitialized = 2,
    Unauthorized = 3,
    NotFound = 4,
    InvalidRating = 5,
    AlreadyVerified = 6,
    AlreadySubmitted = 7,
    InvalidComment = 8,
    SelfReview = 9,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum ReviewStatus {
    Submitted,
    Verified,
    Rejected,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Review {
    pub id: u64,
    pub reviewer: Address,
    pub reviewer_org: u64,
    pub reviewee_org: u64,
    pub relationship_id: u64,
    pub rating: u32,
    pub comment_hash: String,
    pub status: ReviewStatus,
    pub submitted_at: u64,
    pub verified_at: u64,
}

#[contracttype]
#[derive(Clone)]
pub enum DataKey {
    Admin,
    Initialized,
    Registry,
    Reputation,
    Treasury,
    NextId,
    Review(u64),
    PairIndex(u64, u64, u64), // reviewer_org, reviewee_org, relationship_id
    OrgReviews(u64),
    Total,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct OrganizationView {
    pub id: u64,
    pub owner: Address,
    pub name: String,
    pub org_type: OrgTypeView,
    pub metadata_uri: String,
    pub verified: bool,
    pub registered_at: u64,
    pub vendor_count: u32,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub enum OrgTypeView {
    Business,
    Startup,
    Agency,
    Freelancer,
    Vendor,
    ServiceProvider,
}

#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct FeeConfigView {
    pub registration_fee: i128,
    pub relationship_fee: i128,
    pub review_fee: i128,
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

#[contractclient(name = "RegistryClient")]
pub trait RegistryTrait {
    fn get_organization(env: Env, org_id: u64) -> OrganizationView;
}

#[contractclient(name = "ReputationClient")]
pub trait ReputationTrait {
    fn record_verified_review(
        env: Env,
        caller: Address,
        org_id: u64,
        rating: u32,
    ) -> ReputationScoreView;
}

#[contractclient(name = "TreasuryClient")]
pub trait TreasuryTrait {
    fn get_fees(env: Env) -> FeeConfigView;
    fn record_fee(
        env: Env,
        caller: Address,
        payer: Address,
        fee_type: String,
        amount: i128,
    ) -> i128;
}

#[contractimpl]
impl ReviewVerification {
    pub fn initialize(
        env: Env,
        admin: Address,
        registry: Address,
        reputation: Address,
        treasury: Address,
    ) -> Result<(), Error> {
        if env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::AlreadyInitialized);
        }
        admin.require_auth();
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::Registry, &registry);
        env.storage()
            .instance()
            .set(&DataKey::Reputation, &reputation);
        env.storage().instance().set(&DataKey::Treasury, &treasury);
        env.storage().instance().set(&DataKey::Initialized, &true);
        env.storage().instance().set(&DataKey::NextId, &1u64);
        env.storage().instance().set(&DataKey::Total, &0u64);
        env.storage().instance().extend_ttl(100_000, 100_000);
        Ok(())
    }

    pub fn submit_review(
        env: Env,
        reviewer: Address,
        reviewer_org: u64,
        reviewee_org: u64,
        relationship_id: u64,
        rating: u32,
        comment_hash: String,
    ) -> Result<u64, Error> {
        Self::require_init(&env)?;
        reviewer.require_auth();

        if rating < 1 || rating > 5 {
            return Err(Error::InvalidRating);
        }
        if comment_hash.len() < 8 || comment_hash.len() > 128 {
            return Err(Error::InvalidComment);
        }
        if reviewer_org == reviewee_org {
            return Err(Error::SelfReview);
        }

        let registry: Address = env.storage().instance().get(&DataKey::Registry).unwrap();
        let registry_client = RegistryClient::new(&env, &registry);
        let reviewer_org_data = registry_client.get_organization(&reviewer_org);
        let _reviewee = registry_client.get_organization(&reviewee_org);

        if reviewer != reviewer_org_data.owner {
            return Err(Error::Unauthorized);
        }

        let pair_key = DataKey::PairIndex(reviewer_org, reviewee_org, relationship_id);
        if env.storage().persistent().has(&pair_key) {
            return Err(Error::AlreadySubmitted);
        }

        let id: u64 = env.storage().instance().get(&DataKey::NextId).unwrap();
        let review = Review {
            id,
            reviewer: reviewer.clone(),
            reviewer_org,
            reviewee_org,
            relationship_id,
            rating,
            comment_hash: comment_hash.clone(),
            status: ReviewStatus::Submitted,
            submitted_at: env.ledger().timestamp(),
            verified_at: 0,
        };

        env.storage().persistent().set(&DataKey::Review(id), &review);
        env.storage().persistent().set(&pair_key, &id);
        env.storage().instance().set(&DataKey::NextId, &(id + 1));
        let total: u64 = env.storage().instance().get(&DataKey::Total).unwrap();
        env.storage().instance().set(&DataKey::Total, &(total + 1));

        // Fee accounting
        let treasury: Address = env.storage().instance().get(&DataKey::Treasury).unwrap();
        let this_contract = env.current_contract_address();
        let treasury_client = TreasuryClient::new(&env, &treasury);
        let fees = treasury_client.get_fees();
        treasury_client.record_fee(
            &this_contract,
            &reviewer,
            &String::from_str(&env, "review"),
            &fees.review_fee,
        );

        env.events().publish(
            (Symbol::new(&env, "ReviewSubmitted"), id),
            (reviewer, reviewee_org, rating, comment_hash),
        );
        Ok(id)
    }

    pub fn verify_review(env: Env, review_id: u64) -> Result<Review, Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut review = Self::load(&env, review_id)?;
        if review.status != ReviewStatus::Submitted {
            return Err(Error::AlreadyVerified);
        }

        review.status = ReviewStatus::Verified;
        review.verified_at = env.ledger().timestamp();
        env.storage()
            .persistent()
            .set(&DataKey::Review(review_id), &review);

        let reputation: Address = env.storage().instance().get(&DataKey::Reputation).unwrap();
        let this_contract = env.current_contract_address();
        let rep_client = ReputationClient::new(&env, &reputation);
        rep_client.record_verified_review(&this_contract, &review.reviewee_org, &review.rating);

        env.events().publish(
            (Symbol::new(&env, "ReviewVerified"), review_id),
            (review.reviewee_org, review.rating),
        );
        Ok(review)
    }

    pub fn reject_review(env: Env, review_id: u64) -> Result<Review, Error> {
        Self::require_init(&env)?;
        let admin: Address = env.storage().instance().get(&DataKey::Admin).unwrap();
        admin.require_auth();

        let mut review = Self::load(&env, review_id)?;
        if review.status != ReviewStatus::Submitted {
            return Err(Error::AlreadyVerified);
        }
        review.status = ReviewStatus::Rejected;
        env.storage()
            .persistent()
            .set(&DataKey::Review(review_id), &review);
        Ok(review)
    }

    pub fn get_review(env: Env, review_id: u64) -> Result<Review, Error> {
        Self::require_init(&env)?;
        Self::load(&env, review_id)
    }

    pub fn total_reviews(env: Env) -> Result<u64, Error> {
        Self::require_init(&env)?;
        Ok(env.storage().instance().get(&DataKey::Total).unwrap())
    }

    fn require_init(env: &Env) -> Result<(), Error> {
        if !env.storage().instance().has(&DataKey::Initialized) {
            return Err(Error::NotInitialized);
        }
        Ok(())
    }

    fn load(env: &Env, id: u64) -> Result<Review, Error> {
        env.storage()
            .persistent()
            .get(&DataKey::Review(id))
            .ok_or(Error::NotFound)
    }
}

mod test;
