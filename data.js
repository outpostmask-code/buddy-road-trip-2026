// BUDDY road trip data — Aug 9–12, 2026
// Colors are colorblind-safe: amber / purple / teal / sky blue (never red vs green)

const TRIP_DAYS = [
  {
    id: 1,
    date: "2026-08-09",
    label: "Sun Aug 9",
    title: "The Big Drive",
    color: "#F5A623", // amber
    colorSoft: "#FFF3DD",
    points: 275,
    stops: [
      {
        id: "d1-depart",
        driveMin: 0, dwellMin: 0, plannedMin: 540, anchored: true,
        time: "9:00 AM",
        name: "Depart Temple City",
        address: "Temple City, CA",
        lat: 34.1072, lng: -118.0578,
        points: 25,
        phone: null,
        dogFriendly: true,
        quote: "Road trip! I've claimed the back seat."
      },
      {
        id: "d1-sb-topoff",
        driveMin: 100, dwellMin: 10, plannedMin: 640, anchored: false,
        time: "~10:40 AM",
        name: "Santa Barbara Top-off (10 min)",
        address: "3943 State St, Santa Barbara, CA",
        lat: 34.4399, lng: -119.7457,
        points: 25,
        phone: null,
        dogFriendly: true,
        note: "Quick 10-min splash ONLY — just enough to reach Pismo. The real charge happens at lunch. 16 stalls, Five Points center, right off the 101.",
        quote: "A snack stop for the CAR? When is MY snack stop?"
      },
      {
        id: "d1-pismo",
        driveMin: 90, dwellMin: 60, plannedMin: 750, anchored: false,
        time: "~12:30 PM",
        name: "Pismo Beach Supercharge + Lunch",
        address: "333 Five Cities Dr, Pismo Beach, CA",
        lat: 35.1214, lng: -120.6382,
        points: 50,
        phone: null,
        dogFriendly: true,
        note: "THE charging stop — plug in, then eat. Charge to ~90% over lunch; that covers the whole run to Monterey with room to spare.",
        quote: "SAND. I'm going to roll in all of it."
      },
      {
        id: "d1-hyatt",
        driveMin: 135, dwellMin: 30, plannedMin: 960, anchored: true,
        time: "~4:00 PM",
        name: "Hyatt Regency Monterey Check-in",
        address: "1 Old Golf Course Rd, Monterey, CA",
        lat: 36.5945, lng: -121.8931,
        points: 25,
        phone: null,
        dogFriendly: true,
        note: "$100 pet fee. Never leave Buddy alone in the room.",
        quote: "Grass! I must smell every inch."
      },
      {
        id: "d1-lovers",
        driveMin: 12, dwellMin: 45, plannedMin: 1200, anchored: true,
        time: "~8:00 PM",
        name: "Lovers Point Park Sunset",
        address: "Ocean View Blvd, Pacific Grove, CA",
        lat: 36.6255, lng: -121.9285,
        points: 75,
        phone: null,
        dogFriendly: true,
        quote: "Golden hour is my best angle."
      },
      {
        id: "d1-montrio",
        driveMin: 12, dwellMin: 90, plannedMin: 1260, anchored: true,
        time: "Dinner",
        name: "Montrio Bistro",
        address: "414 Calle Principal, Monterey, CA",
        lat: 36.5985, lng: -121.8958,
        points: 75,
        phone: "+18316488880",
        phoneDisplay: "(831) 648-8880",
        dogFriendly: false,
        quote: "A restaurant with a MENU. For DOGS."
      }
    ]
  },
  {
    id: 2,
    date: "2026-08-10",
    label: "Mon Aug 10",
    title: "Fish & Wheels",
    color: "#8B5CF6", // purple
    colorSoft: "#F1EBFF",
    points: 250,
    stops: [
      {
        id: "d2-park",
        driveMin: 10, dwellMin: 5, plannedMin: 570, anchored: false,
        time: "Park",
        name: "Cannery Row Garage",
        address: "601 Foam St, Monterey, CA",
        lat: 36.6157, lng: -121.8998,
        points: 25,
        phone: null,
        dogFriendly: true,
        note: "Dog Mode on in the Tesla.",
        quote: "Guarding the car. It's a big job."
      },
      {
        id: "d2-aquarium",
        driveMin: 5, dwellMin: 150, plannedMin: 600, anchored: true,
        time: "~10:00 AM",
        name: "Monterey Bay Aquarium",
        address: "886 Cannery Row, Monterey, CA",
        lat: 36.6183, lng: -121.9015,
        points: 100,
        phone: "+18316484800",
        phoneDisplay: "(831) 648-4800",
        dogFriendly: false,
        note: "Book morning entry ahead of time.",
        quote: "Fish I cannot chase. Rude."
      },
      {
        id: "d2-lunch",
        driveMin: 5, dwellMin: 60, plannedMin: 750, anchored: false,
        time: "~12:30 PM",
        name: "Lunch on Cannery Row",
        address: "Cannery Row, Monterey, CA",
        lat: 36.6155, lng: -121.9000,
        points: 25,
        phone: null,
        dogFriendly: true,
        quote: "FREEDOM! Also I will be looking at your fries."
      },
      {
        id: "d2-surrey",
        driveMin: 5, dwellMin: 120, plannedMin: 810, anchored: true,
        time: "~1:30 PM",
        name: "Surrey Ride — Adventures by the Sea",
        address: "299 Cannery Row, Monterey, CA",
        lat: 36.6148, lng: -121.8985,
        points: 100,
        phone: "+18313721807",
        phoneDisplay: "(831) 372-1807",
        dogFriendly: true,
        note: "Small $77 / 2 hr, Large $98 / 2 hr. Reserve ahead + confirm dog.",
        quote: "My OWN SEAT?! Best day of my entire life."
      }
    ]
  },
  {
    id: 3,
    date: "2026-08-11",
    label: "Tue Aug 11",
    title: "Big Sur Epic",
    color: "#0D9488", // teal
    colorSoft: "#DFF7F3",
    points: 350,
    stops: [
      {
        id: "d3-depart",
        driveMin: 0, dwellMin: 0, plannedMin: 510, anchored: false,
        time: "8:30 AM",
        name: "Depart South on Hwy 1",
        address: "Monterey, CA",
        lat: 36.5985, lng: -121.8958,
        points: 25,
        phone: null,
        dogFriendly: true,
        quote: "Windows down. Ears out. Let's ride."
      },
      {
        id: "d3-bixby",
        driveMin: 40, dwellMin: 20, plannedMin: 555, anchored: false,
        time: "~9:15 AM",
        name: "Bixby Bridge",
        address: "Bixby Bridge, Big Sur, CA",
        lat: 36.3714, lng: -121.9020,
        points: 50,
        phone: null,
        dogFriendly: true,
        quote: "Big bridge. I shall bark at it. Twice."
      },
      {
        id: "d3-mcway",
        driveMin: 50, dwellMin: 45, plannedMin: 630, anchored: false,
        time: "~10:30 AM",
        name: "McWay Falls — Julia Pfeiffer Burns",
        address: "Julia Pfeiffer Burns State Park, Big Sur, CA",
        lat: 36.1592, lng: -121.6721,
        points: 75,
        phone: null,
        dogFriendly: false,
        note: "NO DOGS on the trail.",
        quote: "Banned. BANNED."
      },
      {
        id: "d3-pfeifferbeach",
        driveMin: 45, dwellMin: 75, plannedMin: 720, anchored: false,
        time: "Midday",
        name: "Pfeiffer Beach",
        address: "Sycamore Canyon Rd, Big Sur, CA",
        lat: 36.2408, lng: -121.8149,
        points: 75,
        phone: null,
        dogFriendly: true,
        note: "$10 CASH entry. Purple sand.",
        quote: "PURPLE sand?? Is it snack flavored?"
      },
      {
        id: "d3-riverinn",
        driveMin: 15, dwellMin: 75, plannedMin: 810, anchored: false,
        time: "Lunch",
        name: "Big Sur River Inn",
        address: "46840 CA-1, Big Sur, CA",
        lat: 36.2506, lng: -121.7825,
        points: 50,
        phone: null,
        dogFriendly: true,
        note: "Dogs allowed on the deck AND in the river.",
        quote: "They let me sit IN the river. 5 stars."
      },
      {
        id: "d3-pfeifferpark",
        driveMin: 5, dwellMin: 60, plannedMin: 900, anchored: false,
        time: "Early PM",
        name: "Pfeiffer Big Sur State Park",
        address: "47225 CA-1, Big Sur, CA",
        lat: 36.2508, lng: -121.7859,
        points: 25,
        phone: null,
        dogFriendly: true,
        note: "$10 CASH entry. Leashed dogs OK.",
        quote: "So many trees. So little time to sniff them all."
      },
      {
        id: "d3-labicyclette",
        driveMin: 45, dwellMin: 90, plannedMin: 1140, anchored: true,
        time: "Dinner",
        name: "La Bicyclette",
        address: "Dolores & 7th, Carmel, CA",
        lat: 36.5552, lng: -121.9233,
        points: 50,
        phone: null,
        dogFriendly: true,
        note: "Patio reserved.",
        quote: "A bicycle-themed restaurant. I do not have a bicycle opinion but I DO have a fries opinion."
      }
    ]
  },
  {
    id: 4,
    date: "2026-08-12",
    label: "Wed Aug 12",
    title: "Last Zoomies & Home",
    color: "#0284C7", // sky blue
    colorSoft: "#E1F1FB",
    points: 150,
    stops: [
      {
        id: "d4-breakfast",
        driveMin: 10, dwellMin: 60, plannedMin: 510, anchored: false,
        time: "Morning",
        name: "First Awakenings",
        address: "125 Ocean View Blvd #105, Pacific Grove, CA",
        lat: 36.6178, lng: -121.9166,
        points: 50,
        phone: null,
        dogFriendly: true,
        quote: "Bacon is a breakfast food. I am a breakfast dog."
      },
      {
        id: "d4-asilomar",
        driveMin: 8, dwellMin: 45, plannedMin: 600, anchored: false,
        time: "Pre-checkout",
        name: "Asilomar Beach",
        address: "Sunset Dr, Pacific Grove, CA",
        lat: 36.6208, lng: -121.9385,
        points: 50,
        phone: null,
        dogFriendly: true,
        quote: "One. Last. ZOOMIE."
      },
      {
        id: "d4-checkout",
        driveMin: 12, dwellMin: 30, plannedMin: 720, anchored: true,
        time: "~Noon",
        name: "Checkout, Drive South 101",
        address: "Monterey, CA",
        lat: 36.5945, lng: -121.8931,
        points: 25,
        phone: null,
        dogFriendly: true,
        quote: "Leaving already? I have not finished smelling this town."
      },
      {
        id: "d4-paso",
        driveMin: 110, dwellMin: 30, plannedMin: 860, anchored: false,
        time: "~2:20 PM",
        name: "Paso Robles Supercharger",
        address: "Paso Robles, CA",
        lat: 35.6266, lng: -120.6910,
        points: 25,
        phone: null,
        dogFriendly: true,
        quote: "Charging AGAIN? Fine. I'll supervise."
      }
    ]
  }
];

const SCAVENGER_HUNT = [
  { id: "sh1", label: "Tesla charging with ocean behind it" },
  { id: "sh2", label: "Sunset silhouette at Lovers Point" },
  { id: "sh3", label: "Sea otter floating on its back" },
  { id: "sh4", label: "Whole family in the surrey — Buddy included" },
  { id: "sh5", label: "Bixby Bridge arch behind you" },
  { id: "sh6", label: "McWay Falls postcard shot" },
  { id: "sh7", label: "Purple sand close-up at Pfeiffer Beach" },
  { id: "sh8", label: "Buddy's last beach photo at Asilomar" }
];

const PRETRIP_CHECKLIST = [
  { id: "pc1", label: "Book aquarium tickets — morning entry Monday" },
  { id: "pc2", label: "Call surrey (831) 372-1807 — reserve + confirm dog" },
  { id: "pc3", label: "Reserve Montrio (Sun) + La Bicyclette (Tue) — patio" },
  { id: "pc4", label: "Get $20+ cash for Tuesday" },
  { id: "pc5", label: "Pack real jackets (54°F mornings)" },
  { id: "pc6", label: "Buddy kit: leash, bowl, bags, towel, blanket" },
  { id: "pc7", label: "Hyatt: $100 pet fee, never leave Buddy alone in room" }
];

const BADGES = [
  { id: "road-warrior", name: "ROAD WARRIOR", desc: "Completed every Day 1 stop", check: (done) => TRIP_DAYS[0].stops.every(s => done.has(s.id)) },
  { id: "fish-whisperer", name: "FISH WHISPERER", desc: "Completed every Day 2 stop", check: (done) => TRIP_DAYS[1].stops.every(s => done.has(s.id)) },
  { id: "big-sur-explorer", name: "BIG SUR EXPLORER", desc: "Completed every Day 3 stop", check: (done) => TRIP_DAYS[2].stops.every(s => done.has(s.id)) },
  { id: "homeward-hound", name: "HOMEWARD HOUND", desc: "Completed every Day 4 stop", check: (done) => TRIP_DAYS[3].stops.every(s => done.has(s.id)) },
  { id: "good-boy", name: "GOOD BOY", desc: "Completed every dog-friendly stop", check: (done) => TRIP_DAYS.flatMap(d => d.stops).filter(s => s.dogFriendly).every(s => done.has(s.id)) },
  { id: "shutterbug", name: "SHUTTERBUG", desc: "Completed all 8 photo challenges", check: (done, photos) => SCAVENGER_HUNT.every(p => photos.has(p.id)) }
];

const TOTAL_TRIP_POINTS = TRIP_DAYS.reduce((sum, d) => sum + d.points, 0);
const TOTAL_BONUS_POINTS = SCAVENGER_HUNT.length * 25;
