export type Listing = {
  id: string;
  title: string;
  price: string;
  location: string;
  color: string; // placeholder swatch instead of a real photo
  category?: string;
};

export const galleryListings: Listing[] = [
  { id: "g1", title: "Fully-Furnished 1-Bedroom Suite", price: "$1,850", location: "Canada", color: "#C9BFE0" },
  { id: "g2", title: "Chihuahua Pups (toy)", price: "$1,000", location: "Canada", color: "#E3C9A6" },
  { id: "g3", title: "Shop & Fleet Manager — Hiring", price: "Please Contact", location: "Canada", color: "#B7D3C4" },
  { id: "g4", title: "Mobile Massage — Introductory Offer", price: "Please Contact", location: "Canada", color: "#D8C7D0" },
  { id: "g5", title: "AZ Truck Driver Wanted", price: "Please Contact", location: "Canada", color: "#C6D2E0" },
];

export const nearbyListings: Listing[] = [
  { id: "n1", title: "2023-2024 Upper Deck Hockey Set", price: "$60", location: "Oakville / Halton Region", color: "#CBB79A" },
  { id: "n2", title: "Nike Air Force 1 — Size 10", price: "$75", location: "Laval", color: "#B9C3CC" },
  { id: "n3", title: "Female Driving Instructor Available", price: "Please Contact", location: "Whitby", color: "#E4C1C1" },
  { id: "n4", title: "Home Jersey #17", price: "$70", location: "Toronto", color: "#CFD8E3" },
  { id: "n5", title: "Beverage Dispenser, Barely Used", price: "$30", location: "Brampton", color: "#D6D0C2" },
];

export const buySellListings: Listing[] = [
  { id: "b1", title: "225/65R17 Winter Tires, Set of 4", price: "$25", location: "Canada", color: "#C8C4CE" },
  { id: "b2", title: "Looking For 225/65 R17 Winters", price: "Please Contact", location: "Canada", color: "#D3CBB8" },
  { id: "b3", title: "Motorcycle Owner's Manual", price: "$10", location: "Canada", color: "#C1CFC5" },
  { id: "b4", title: "Sedan Owner's Manual, 2004", price: "$10", location: "Canada", color: "#D9C7C0" },
  { id: "b5", title: "Side-by-Side, Low Hours", price: "$5,000", location: "Canada", color: "#BFC9D6" },
];

export const realEstateListings: Listing[] = [
  { id: "r1", title: "Bright 1 Bedroom Apartment", price: "$1,895", location: "Canada", color: "#CFC6DE" },
  { id: "r2", title: "Bright 1 or 2 Bedroom Suite", price: "$1,290", location: "Canada", color: "#D1CBBE" },
  { id: "r3", title: "2 Bedroom, 2 Bathroom Condo", price: "$500", location: "Canada", color: "#C3D0CB" },
  { id: "r4", title: "2 Bedroom Apartment for Rent", price: "$2,000", location: "Canada", color: "#D8CBCB" },
  { id: "r5", title: "Spruceland Apartment for Rent", price: "$1,400", location: "Canada", color: "#C7CDD8" },
];

export const similarPetListings: Listing[] = [
  { id: "p1", title: "Chihuahua Puppies (4 months)", price: "$500", location: "Brantford", color: "#D9CBB0" },
  { id: "p2", title: "Pug Puppies, Boys and Girls", price: "$1,500", location: "Brantford", color: "#C7C7CD" },
  { id: "p3", title: "Registered Miniature Dachshund", price: "$3,500", location: "Brantford", color: "#B79A7C" },
  { id: "p4", title: "Shih Apso Puppy, Only 1 Left", price: "$1,250", location: "Brantford", color: "#E1D7C2" },
  { id: "p5", title: "Cane Corso, Health Tested", price: "Please Contact", location: "Brantford", color: "#8C8A8E" },
];

export const petListingDetail = {
  id: "1742630584",
  title: "Chihuahua Pups (toy)",
  price: "$1,000",
  postedAgo: "6 days ago",
  breadcrumb: ["Home", "Pets", "Dogs & Puppies for Rehoming for Brantford"],
  earliestRehomingDate: "October 5, 2026",
  dob: "August 10, 2026 (6 weeks old)",
  breed: "Chihuahua",
  description: [
    "Pups are 4 weeks. Please read the ad before messaging.",
    "Price is firm. Serious inquiries only — a non-refundable deposit of $200 is required to hold a pup. No holds without a deposit.",
    "I will no longer reply unless you are seriously scheduling a time to see them and buy. I will not send additional pictures unless you have already secured your puppy. Thank you for understanding.",
    "4 Chihuahua pups born August 10th. Raised in-home with children and other pets. Will come vet checked with first shots.",
  ],
  seller: {
    name: "Sharmaine Gibson",
    verified: true,
    rating: 5.0,
    reviews: 1,
    memberSince: "April 2021",
    location: "Ohsweken, ON N0A 1M0",
    avgReply: "< 1 day",
    replyRate: "95%",
    yearsOnSite: "5 yrs",
    views: 1936,
  },
};
