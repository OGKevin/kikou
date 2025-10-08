use serde::{Deserialize, Deserializer, Serialize};
use std::fmt;
use std::str::FromStr;

#[derive(Debug, Clone, PartialEq, Serialize)]
pub enum YesNo {
    Unknown,
    No,
    Yes,
}

impl<'de> Deserialize<'de> for YesNo {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(YesNo::from_str(&s).unwrap_or(YesNo::Unknown))
    }
}

impl FromStr for YesNo {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Yes" => Ok(YesNo::Yes),
            "No" => Ok(YesNo::No),
            _ => Ok(YesNo::Unknown),
        }
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub enum Manga {
    Unknown,
    No,
    Yes,
    #[serde(rename = "YesAndRightToLeft")]
    YesAndRightToLeft,
}

impl FromStr for Manga {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Yes" => Ok(Manga::Yes),
            "No" => Ok(Manga::No),
            "YesAndRightToLeft" => Ok(Manga::YesAndRightToLeft),
            _ => Ok(Manga::Unknown),
        }
    }
}

impl<'de> Deserialize<'de> for Manga {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(Manga::from_str(&s).unwrap_or(Manga::Unknown))
    }
}

#[derive(Debug, Clone, PartialEq, Serialize)]
pub enum AgeRating {
    Unknown,
    #[serde(rename = "Adults Only 18+")]
    AdultsOnly18Plus,
    #[serde(rename = "Early Childhood")]
    EarlyChildhood,
    Everyone,
    #[serde(rename = "Everyone 10+")]
    Everyone10Plus,
    G,
    #[serde(rename = "Kids to Adults")]
    KidsToAdults,
    M,
    #[serde(rename = "MA15+")]
    MA15Plus,
    #[serde(rename = "Mature 17+")]
    Mature17Plus,
    PG,
    #[serde(rename = "R18+")]
    R18Plus,
    #[serde(rename = "Rating Pending")]
    RatingPending,
    Teen,
    #[serde(rename = "X18+")]
    X18Plus,
}

impl FromStr for AgeRating {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "Adults Only 18+" => Ok(AgeRating::AdultsOnly18Plus),
            "Early Childhood" => Ok(AgeRating::EarlyChildhood),
            "Everyone" => Ok(AgeRating::Everyone),
            "Everyone 10+" => Ok(AgeRating::Everyone10Plus),
            "G" => Ok(AgeRating::G),
            "Kids to Adults" => Ok(AgeRating::KidsToAdults),
            "M" => Ok(AgeRating::M),
            "MA15+" => Ok(AgeRating::MA15Plus),
            "Mature 17+" => Ok(AgeRating::Mature17Plus),
            "PG" => Ok(AgeRating::PG),
            "R18+" => Ok(AgeRating::R18Plus),
            "Rating Pending" => Ok(AgeRating::RatingPending),
            "Teen" => Ok(AgeRating::Teen),
            "X18+" => Ok(AgeRating::X18Plus),
            _ => Ok(AgeRating::Unknown),
        }
    }
}

impl<'de> Deserialize<'de> for AgeRating {
    fn deserialize<D>(deserializer: D) -> Result<Self, D::Error>
    where
        D: Deserializer<'de>,
    {
        let s = String::deserialize(deserializer)?;
        Ok(AgeRating::from_str(&s).unwrap_or(AgeRating::Unknown))
    }
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
pub enum ComicPageType {
    FrontCover,
    InnerCover,
    Roundup,
    Story,
    Advertisement,
    Editorial,
    Letters,
    Preview,
    BackCover,
    Other,
    Deleted,
}

impl fmt::Display for ComicPageType {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        let s = match self {
            ComicPageType::FrontCover => "FrontCover",
            ComicPageType::InnerCover => "InnerCover",
            ComicPageType::Roundup => "Roundup",
            ComicPageType::Story => "Story",
            ComicPageType::Advertisement => "Advertisement",
            ComicPageType::Editorial => "Editorial",
            ComicPageType::Letters => "Letters",
            ComicPageType::Preview => "Preview",
            ComicPageType::BackCover => "BackCover",
            ComicPageType::Other => "Other",
            ComicPageType::Deleted => "Deleted",
        };
        write!(f, "{}", s)
    }
}

impl FromStr for ComicPageType {
    type Err = ();

    fn from_str(s: &str) -> Result<Self, Self::Err> {
        match s {
            "FrontCover" => Ok(ComicPageType::FrontCover),
            "InnerCover" => Ok(ComicPageType::InnerCover),
            "Roundup" => Ok(ComicPageType::Roundup),
            "Story" => Ok(ComicPageType::Story),
            "Advertisement" => Ok(ComicPageType::Advertisement),
            "Editorial" => Ok(ComicPageType::Editorial),
            "Letters" => Ok(ComicPageType::Letters),
            "Preview" => Ok(ComicPageType::Preview),
            "BackCover" => Ok(ComicPageType::BackCover),
            "Other" => Ok(ComicPageType::Other),
            "Deleted" => Ok(ComicPageType::Deleted),
            _ => Ok(ComicPageType::Other),
        }
    }
}

pub fn default_minus_one() -> i32 {
    -1
}

pub fn is_false(b: &bool) -> bool {
    !b
}

pub fn is_minus_one(i: &i32) -> bool {
    *i == -1
}

pub fn is_zero_i64(i: &i64) -> bool {
    *i == 0
}

pub fn is_zero_i32(i: &i32) -> bool {
    *i == 0
}

pub fn is_unknown_yes_no(y: &YesNo) -> bool {
    *y == YesNo::Unknown
}

pub fn is_unknown_manga(m: &Manga) -> bool {
    *m == Manga::Unknown
}

pub fn is_unknown_age_rating(a: &AgeRating) -> bool {
    *a == AgeRating::Unknown
}

pub fn default_yes_no() -> YesNo {
    YesNo::Unknown
}

pub fn default_manga() -> Manga {
    Manga::Unknown
}

pub fn default_age_rating() -> AgeRating {
    AgeRating::Unknown
}
