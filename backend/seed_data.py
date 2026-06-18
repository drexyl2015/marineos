"""Seed demo data — 1 000+ seafarers across a realistic global fleet"""
import random
from datetime import datetime, timedelta, date
from app.models import Base, Crew, Certificate, Vessel, CrewAssignment, Alert
from app.database import engine, SessionLocal

# ── Name pools by nationality ─────────────────────────────────────────────────

NATIONALITIES = {
    "Filipino": {
        "first": ["Jose", "Juan", "Mark", "Michael", "Ronaldo", "Christian", "Jeffrey",
                  "Ariel", "Danilo", "Eduardo", "Fernando", "Gilbert", "Harold", "Ivan",
                  "Jayson", "Kevin", "Leonardo", "Manuel", "Nelson", "Oscar", "Paolo",
                  "Ramon", "Salvador", "Teodoro", "Victor", "Warren", "Xavier", "Rodrigo",
                  "Maricel", "Arlene", "Rosario", "Liza", "Elena", "Marites"],
        "last":  ["Santos", "Reyes", "Cruz", "Bautista", "Ocampo", "Garcia", "Torres",
                  "Flores", "Aquino", "Diaz", "Mendoza", "Dela Cruz", "Villanueva",
                  "Ramos", "Lopez", "Castillo", "Gonzales", "Buenaventura", "Padilla",
                  "Navarro", "Rivera", "Pascual", "Santiago", "Morales", "Fernandez"],
        "weight": 30,
    },
    "Indian": {
        "first": ["Rajesh", "Suresh", "Vikram", "Anil", "Deepak", "Mahesh", "Rohit",
                  "Sanjay", "Ajay", "Pradeep", "Dinesh", "Rakesh", "Anand", "Vijay",
                  "Ashok", "Ramesh", "Yogesh", "Naresh", "Ganesh", "Harish", "Kamal",
                  "Sunil", "Nitin", "Manish", "Girish", "Sachin", "Amit", "Pavan"],
        "last":  ["Sharma", "Singh", "Patel", "Kumar", "Joshi", "Gupta", "Yadav",
                  "Mehta", "Nair", "Pillai", "Reddy", "Rao", "Iyer", "Verma",
                  "Tiwari", "Dubey", "Mishra", "Pandey", "Srivastava", "Chauhan"],
        "weight": 12,
    },
    "Indonesian": {
        "first": ["Budi", "Agus", "Hendra", "Wahyu", "Rizki", "Eko", "Dedi", "Bambang",
                  "Slamet", "Joko", "Andi", "Dian", "Rudi", "Surya", "Yusuf", "Fauzan",
                  "Arif", "Taufik", "Rahmat", "Fajar", "Bayu", "Hasan", "Imam"],
        "last":  ["Santoso", "Wibowo", "Pratama", "Kurniawan", "Setiawan", "Hidayat",
                  "Saputra", "Nugroho", "Purnomo", "Susanto", "Wahyudi", "Gunawan",
                  "Haryanto", "Suryadi", "Widodo", "Raharjo"],
        "weight": 8,
    },
    "Myanmar": {
        "first": ["Kyaw", "Aung", "Min", "Zaw", "Thura", "Naing", "Htun", "Win",
                  "Myo", "Soe", "Htet", "Yan", "Thu", "Tun", "Ko", "Phyo"],
        "last":  ["Oo", "Lwin", "Myint", "Khin", "Htwe", "Nwe", "Lay", "Zin",
                  "Phyu", "Wai", "Thant", "Kyaw Zin", "Aung Myint"],
        "weight": 6,
    },
    "Ukrainian": {
        "first": ["Oleksiy", "Dmytro", "Serhiy", "Volodymyr", "Mykola", "Andriy",
                  "Vasyl", "Ihor", "Pavlo", "Roman", "Taras", "Bohdan", "Oleh",
                  "Yuriy", "Maksym", "Denys", "Artem", "Vitaliy", "Ruslan"],
        "last":  ["Kovalenko", "Shevchenko", "Bondarenko", "Tkachenko", "Petrenko",
                  "Moroz", "Savchenko", "Kovalchuk", "Lysenko", "Marchenko",
                  "Kravchenko", "Oliynyk", "Semenko", "Ponomarenko"],
        "weight": 5,
    },
    "Russian": {
        "first": ["Alexei", "Dmitri", "Sergei", "Vladimir", "Nikolai", "Andrei",
                  "Pavel", "Igor", "Mikhail", "Yuri", "Konstantin", "Evgeny",
                  "Vasily", "Anton", "Arkady", "Boris", "Viktor"],
        "last":  ["Ivanov", "Petrov", "Sidorov", "Smirnov", "Kuznetsov", "Popov",
                  "Volkov", "Sokolov", "Mikhailov", "Novikov", "Fedorov", "Morozov",
                  "Kozlov", "Lebedev", "Semyonov", "Orlov"],
        "weight": 4,
    },
    "Croatian": {
        "first": ["Marko", "Ivan", "Nikola", "Tomislav", "Goran", "Josip", "Luka",
                  "Ante", "Mario", "Damir", "Igor", "Bruno", "Stjepan", "Franjo"],
        "last":  ["Horvat", "Kovačević", "Babić", "Marković", "Nikolić", "Jurić",
                  "Tomić", "Knezević", "Kovač", "Vuković", "Perić", "Matić",
                  "Novaković", "Pavić"],
        "weight": 3,
    },
    "Greek": {
        "first": ["Nikos", "Giorgos", "Kostas", "Dimitris", "Yannis", "Petros",
                  "Michalis", "Christos", "Thanasis", "Alexandros", "Vasilis", "Spiros"],
        "last":  ["Papadopoulos", "Georgiou", "Nikolaou", "Christodoulou", "Alexandrou",
                  "Petrou", "Stavros", "Angelopoulos", "Theodorou", "Konstantinou"],
        "weight": 3,
    },
    "Turkish": {
        "first": ["Mehmet", "Mustafa", "Ahmet", "Ali", "Hasan", "Huseyin", "Ibrahim",
                  "Ismail", "Osman", "Murat", "Kemal", "Recep", "Fatih", "Yusuf"],
        "last":  ["Yilmaz", "Kaya", "Demir", "Şahin", "Çelik", "Yıldız", "Yıldırım",
                  "Öztürk", "Aydın", "Özdemir", "Arslan", "Doğan", "Kılıç"],
        "weight": 3,
    },
    "Egyptian": {
        "first": ["Mohamed", "Ahmed", "Mahmoud", "Khaled", "Ibrahim", "Hassan",
                  "Mostafa", "Omar", "Amr", "Tarek", "Walid", "Sherif", "Hossam"],
        "last":  ["Mohamed", "Ahmed", "Ibrahim", "Hassan", "El-Sayed", "Yousef",
                  "Saleh", "Kamel", "Fathy", "Abdel-Rahman", "Mahmoud", "Ali"],
        "weight": 3,
    },
    "Vietnamese": {
        "first": ["Nguyen", "Tran", "Le", "Pham", "Hoang", "Minh", "Duc", "Tuan",
                  "Dung", "Nam", "Hung", "Hai", "Long", "Vinh", "Phong"],
        "last":  ["Van", "Huu", "Dinh", "Quoc", "Thanh", "Xuan", "Anh", "Bao",
                  "Chi", "Dang", "Gia", "Lam"],
        "weight": 3,
    },
    "Bangladeshi": {
        "first": ["Mohammad", "Md", "Abdul", "Md Abdul", "Rafiqul", "Kamal", "Jamil",
                  "Shafiqul", "Nazrul", "Saiful", "Anisur", "Habibur", "Mokbul"],
        "last":  ["Islam", "Rahman", "Hossain", "Ahmed", "Ali", "Khan", "Miah",
                  "Uddin", "Alam", "Sarkar", "Chowdhury", "Begum"],
        "weight": 3,
    },
    "Polish": {
        "first": ["Piotr", "Krzysztof", "Andrzej", "Tomasz", "Jan", "Marek",
                  "Marcin", "Michał", "Sławomir", "Zbigniew", "Ryszard", "Grzegorz"],
        "last":  ["Kowalski", "Nowak", "Wiśniewski", "Wójcik", "Kowalczyk",
                  "Kamiński", "Lewandowski", "Zieliński", "Szymański", "Woźniak"],
        "weight": 2,
    },
    "Romanian": {
        "first": ["Ion", "Gheorghe", "Constantin", "Vasile", "Florin", "Mihai",
                  "Bogdan", "Cristian", "Adrian", "Gabriel", "Dan", "Marius"],
        "last":  ["Popescu", "Ionescu", "Constantin", "Gheorghe", "Popa", "Radu",
                  "Dumitru", "Stancu", "Marin", "Tudor", "Iancu"],
        "weight": 2,
    },
    "British": {
        "first": ["James", "John", "Robert", "William", "Thomas", "David",
                  "Richard", "Peter", "Andrew", "Mark", "Paul", "Alan", "Stephen"],
        "last":  ["Smith", "Jones", "Williams", "Brown", "Taylor", "Davies",
                  "Wilson", "Evans", "Thomas", "Roberts", "Johnson", "Walker"],
        "weight": 2,
    },
    "Chinese": {
        "first": ["Wei", "Jian", "Ming", "Hao", "Long", "Fang", "Cheng", "Xiao",
                  "Zheng", "Bin", "Tao", "Yang", "Peng", "Lei", "Qiang"],
        "last":  ["Wang", "Li", "Zhang", "Liu", "Chen", "Yang", "Huang", "Zhao",
                  "Wu", "Zhou", "Xu", "Sun", "Ma", "Zhu", "He"],
        "weight": 2,
    },
}

POSITIONS = [
    ("Master", "officer"),
    ("Chief Officer", "officer"),
    ("Second Officer", "officer"),
    ("Third Officer", "officer"),
    ("Chief Engineer", "engineer"),
    ("Second Engineer", "engineer"),
    ("Third Engineer", "engineer"),
    ("Fourth Engineer", "engineer"),
    ("Electrical Officer", "engineer"),
    ("Bosun", "rating"),
    ("Able Seaman", "rating"),
    ("Able Seaman", "rating"),
    ("Able Seaman", "rating"),
    ("Ordinary Seaman", "rating"),
    ("Ordinary Seaman", "rating"),
    ("Pumpman", "rating"),
    ("Fitter", "rating"),
    ("Motorman", "rating"),
    ("Oiler", "rating"),
    ("Chief Cook", "rating"),
    ("Cook", "rating"),
    ("Steward", "rating"),
    ("Cadet (Deck)", "cadet"),
    ("Cadet (Engine)", "cadet"),
]

VESSEL_TYPES = [
    "Container Ship", "Bulk Carrier", "Oil Tanker", "Chemical Tanker",
    "LPG Tanker", "LNG Carrier", "General Cargo", "Ro-Ro", "Car Carrier",
    "Offshore Supply Vessel", "Passenger Ship", "Crude Oil Tanker",
    "Product Tanker", "Reefer Vessel",
]

FLAG_STATES = [
    "Panama", "Liberia", "Marshall Islands", "Bahamas", "Singapore",
    "Malta", "Cyprus", "Hong Kong", "Greece", "China", "United Kingdom",
    "Denmark", "Norway", "Japan", "Germany", "Italy",
]

CERT_CONFIGS = {
    "officer": [
        ("STCW Certificate of Competency", ["UK MCA", "MARINA Philippines", "India DG Shipping",
                                             "Panama Maritime Authority", "Liberian Registry",
                                             "Bahamas Maritime Authority", "MPA Singapore"]),
        ("Medical Certificate (ENG1)", ["Approved Medical Examiner", "Port Health Authority",
                                         "Class A Medical Center"]),
        ("GMDSS General Operator Certificate", ["ITU", "UK MCA", "FCC"]),
        ("Advanced Fire Fighting", ["STCW Training Center", "Maritime Academy"]),
        ("Ship Security Officer Certificate", ["IMO Approved Center"]),
        ("Bridge Resource Management", ["DNV GL", "Lloyd's Register", "Bureau Veritas"]),
        ("ECDIS Type-Specific Certificate", ["Furuno", "JRC", "Kongsberg", "Transas"]),
    ],
    "engineer": [
        ("STCW Certificate of Competency – Engineer", ["UK MCA", "India DG Shipping",
                                                         "MARINA Philippines", "Panama Maritime Authority",
                                                         "MPA Singapore"]),
        ("Medical Certificate (ENG1)", ["Approved Medical Examiner", "Port Health Authority"]),
        ("Advanced Fire Fighting", ["STCW Training Center", "Maritime Academy"]),
        ("High Voltage Certificate", ["DNV GL", "Bureau Veritas"]),
        ("Engine Resource Management", ["DNV GL", "Lloyd's Register"]),
        ("Refrigeration Certificate", ["STCW Training Center"]),
        ("Ship Security Officer Certificate", ["IMO Approved Center"]),
    ],
    "rating": [
        ("Basic Safety Training (BST)", ["STCW Training Center", "Maritime Academy",
                                          "MARINA Philippines", "India DG Shipping"]),
        ("Medical Certificate (ENG1)", ["Approved Medical Examiner", "Port Health Authority"]),
        ("Proficiency in Survival Craft", ["STCW Training Center"]),
        ("Security Awareness Training", ["IMO Approved Center"]),
        ("Advanced Fire Fighting", ["STCW Training Center"]),
    ],
    "cadet": [
        ("Basic Safety Training (BST)", ["STCW Training Center", "Maritime Academy"]),
        ("Medical Certificate (ENG1)", ["Approved Medical Examiner"]),
        ("Security Awareness Training", ["IMO Approved Center"]),
    ],
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def weighted_choice(options_dict):
    keys = list(options_dict.keys())
    weights = [options_dict[k]["weight"] for k in keys]
    return random.choices(keys, weights=weights, k=1)[0]

def random_name(nationality):
    pool = NATIONALITIES[nationality]
    return f"{random.choice(pool['first'])} {random.choice(pool['last'])}"

def random_date_past(min_days=30, max_days=1800):
    return date.today() - timedelta(days=random.randint(min_days, max_days))

def cert_expiry(issue: date, cert_type: str) -> date:
    if "Medical" in cert_type:
        return issue + timedelta(days=random.randint(365, 730))
    if "BST" in cert_type or "Basic Safety" in cert_type:
        return issue + timedelta(days=365 * 5)
    if "GMDSS" in cert_type:
        return issue + timedelta(days=365 * 5)
    return issue + timedelta(days=random.randint(365 * 3, 365 * 5))

def make_cert(crew_id, cert_type, authority, offset_days_ago):
    issue = date.today() - timedelta(days=offset_days_ago)
    expiry = cert_expiry(issue, cert_type)
    return Certificate(
        crew_id=crew_id,
        certificate_type=cert_type,
        issue_date=issue,
        expiry_date=expiry,
        issuing_authority=authority,
        ratings=[],
        endorsements=[],
    )

# ── Main seeder ───────────────────────────────────────────────────────────────

def seed_demo_data():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Clear existing data (preserve users)
    db.query(Alert).delete()
    db.query(CrewAssignment).delete()
    db.query(Certificate).delete()
    db.query(Crew).delete()
    db.query(Vessel).delete()
    db.commit()

    # ── Vessels ───────────────────────────────────────────────────────────────
    vessel_names = [
        "MV Pacific Explorer", "MV Atlantic Pioneer", "MV Nordic Star",
        "MV Arabian Gulf", "MV Baltic Eagle", "MV Caribbean Trader",
        "MV Eastern Promise", "MV Western Spirit", "MV Southern Cross",
        "MV Northern Light", "MV Ocean Voyager", "MV Sea Champion",
        "MV Global Merchant", "MV Maritime Pride", "MV Pacific Trader",
        "MV Atlantic Carrier", "MV Nordic Bulk", "MV Mediterranean Sun",
        "MV Indian Ocean", "MV Far East Express", "MV Trans Pacific",
        "MV Euro Trader", "MV Atlas Marine", "MV Horizon Seeker",
        "MT Gulf Stream", "MT Coral Sea", "MT Arctic Wind", "MT Desert Sun",
        "MT Emerald Isle", "MV Silver Marlin",
    ]
    imo_base = 9100000
    vessels = []
    for i, vname in enumerate(vessel_names):
        v = Vessel(
            name=vname,
            imo=str(imo_base + i * 13),
            vessel_type=random.choice(VESSEL_TYPES),
            flag_state=random.choice(FLAG_STATES),
            status=random.choice(["active", "active", "active", "maintenance"]),
        )
        vessels.append(v)
    db.add_all(vessels)
    db.flush()

    # ── Crew (1 050 members) ──────────────────────────────────────────────────
    TOTAL_CREW = 1050
    statuses = ["available"] * 40 + ["onboard"] * 40 + ["on_leave"] * 15 + ["standby"] * 5
    all_crew = []
    used_ids = set()

    for i in range(TOTAL_CREW):
        nationality = weighted_choice(NATIONALITIES)
        name = random_name(nationality)
        position, pos_type = random.choice(POSITIONS)
        status = random.choice(statuses)

        emp_id = f"SF{str(i + 1).zfill(5)}"
        while emp_id in used_ids:
            emp_id = f"SF{random.randint(10000, 99999)}"
        used_ids.add(emp_id)

        first = name.split()[0].lower()
        last = name.split()[-1].lower().replace(" ", "")
        email = f"{first}.{last}{random.randint(1, 99)}@maritimemail.com"

        c = Crew(
            name=name,
            employee_id=emp_id,
            nationality=nationality,
            position=position,
            status=status,
            email=email,
            phone=f"+{random.randint(1,99)}{random.randint(1000000000, 9999999999)}",
        )
        all_crew.append(c)

    db.add_all(all_crew)
    db.flush()

    # ── Certificates ──────────────────────────────────────────────────────────
    all_certs = []
    for c in all_crew:
        _, pos_type = next((p for p in POSITIONS if p[0] == c.position), (c.position, "rating"))
        pool = CERT_CONFIGS.get(pos_type, CERT_CONFIGS["rating"])

        # Pick 2–4 certs per crew member, weighted: first cert is mandatory
        num_certs = random.choices([2, 3, 4], weights=[25, 50, 25])[0]
        chosen = [pool[0]] + random.sample(pool[1:], min(num_certs - 1, len(pool) - 1))

        for cert_type, authorities in chosen:
            authority = random.choice(authorities)
            # Vary the issue dates: some old, some recent, some expiring soon
            offset = random.choices(
                [random.randint(30, 200),    # expiring soon / just issued
                 random.randint(200, 800),   # mid-life
                 random.randint(800, 1500)], # getting old
                weights=[20, 55, 25]
            )[0]
            all_certs.append(make_cert(c.id, cert_type, authority, offset))

    db.add_all(all_certs)
    db.flush()

    # ── Vessel assignments (put ~60 % of crew on vessels) ────────────────────
    onboard_crew = [c for c in all_crew if c.status == "onboard"]
    active_vessels = [v for v in vessels if v.status == "active"]
    assignments = []
    for c in onboard_crew:
        vessel = random.choice(active_vessels)
        a = CrewAssignment(
            crew_id=c.id,
            vessel_id=vessel.id,
            position=c.position,
            assignment_date=datetime.utcnow() - timedelta(days=random.randint(1, 180)),
            expected_end_date=datetime.utcnow() + timedelta(days=random.randint(30, 180)),
            status="active",
        )
        assignments.append(a)
    db.add_all(assignments)
    db.flush()

    # ── Alerts for expiring / expired certificates ───────────────────────────
    alerts = []
    today = date.today()
    for cert in all_certs:
        days_left = (cert.expiry_date - today).days
        if days_left < 0:
            # expired
            crew = next(c for c in all_crew if c.id == cert.crew_id)
            alerts.append(Alert(
                crew_id=cert.crew_id,
                alert_type="certificate_expired",
                severity="critical",
                message=f"{cert.certificate_type} for {crew.name} expired {abs(days_left)} days ago.",
                resolved=False,
            ))
        elif days_left <= 30:
            crew = next(c for c in all_crew if c.id == cert.crew_id)
            alerts.append(Alert(
                crew_id=cert.crew_id,
                alert_type="certificate_expiring",
                severity="high",
                message=f"{cert.certificate_type} for {crew.name} expires in {days_left} days.",
                resolved=False,
            ))
        elif days_left <= 90:
            crew = next(c for c in all_crew if c.id == cert.crew_id)
            alerts.append(Alert(
                crew_id=cert.crew_id,
                alert_type="certificate_expiring_soon",
                severity="medium",
                message=f"{cert.certificate_type} for {crew.name} expires in {days_left} days.",
                resolved=random.choice([False, False, True]),
            ))

    db.add_all(alerts)
    db.commit()

    available = sum(1 for c in all_crew if c.status == "available")
    onboard   = sum(1 for c in all_crew if c.status == "onboard")
    on_leave  = sum(1 for c in all_crew if c.status == "on_leave")
    standby   = sum(1 for c in all_crew if c.status == "standby")

    print("✅ Demo data seeded successfully!")
    print(f"   Vessels    : {len(vessels)}")
    print(f"   Crew       : {len(all_crew)}  (available {available} | onboard {onboard} | on_leave {on_leave} | standby {standby})")
    print(f"   Certificates: {len(all_certs)}")
    print(f"   Assignments : {len(assignments)}")
    print(f"   Alerts      : {len(alerts)}")
    db.close()

if __name__ == "__main__":
    seed_demo_data()
