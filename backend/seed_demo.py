#!/usr/bin/env python
"""
Demo seed — 5 vessels, 205 seafarers, full STCW/MLC certificates, realistic alerts.

Usage:
  python seed_demo.py           # seed (skips if demo data exists)
  python seed_demo.py --reset   # wipe and re-seed
"""
import sys
import os
import random
from datetime import date, datetime, timedelta

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.database import SessionLocal, Base, engine
from app.models import Vessel, Crew, Certificate, CrewAssignment, Alert

random.seed(42)
TODAY = date.today()
NOW = datetime.utcnow()

# ── 5 Vessels ─────────────────────────────────────────────────────────────────

VESSELS_DATA = [
    dict(name="MV Adriatic Star",      imo="9123456", vessel_type="Chemical Tanker",  flag_state="Marshall Islands"),
    dict(name="MV Pacific Challenger", imo="9234567", vessel_type="AHTS",             flag_state="Panama"),
    dict(name="MV Global Pioneer",     imo="9345678", vessel_type="Dry Cargo",         flag_state="Liberia"),
    dict(name="MV Ocean Express",      imo="9456789", vessel_type="Container Ship",    flag_state="Singapore"),
    dict(name="MV Cape Horizon",       imo="9567890", vessel_type="Bulk Carrier",      flag_state="Bahamas"),
]

DEMO_IMOS = [v["imo"] for v in VESSELS_DATA]

# ── 11 Billets per vessel ─────────────────────────────────────────────────────

BILLET_POSITIONS = [
    "Master",
    "Chief Officer",
    "Second Officer",
    "Chief Engineer",
    "Second Engineer",
    "ETO",
    "Cook",
    "Bosun",
    "Able Seaman",
    "Able Seaman",
    "Ordinary Seaman",
]

# ── STCW / MLC Certificates per position ─────────────────────────────────────

CERT_SPECS = {
    "Master": [
        ("Certificate of Competency - Master (STCW II/2)",       "Maritime Administration"),
        ("Medical Certificate (ENG1)",                             "Approved Medical Examiner"),
        ("STCW Basic Safety Training (VI/1)",                     "Maritime Training Centre"),
        ("GMDSS General Operator Certificate",                    "Maritime Authority"),
        ("Advanced Fire Fighting (STCW VI/3)",                    "Maritime Training Centre"),
        ("Proficiency in Survival Craft (STCW VI/2)",             "Maritime Training Centre"),
        ("ECDIS Type-Specific Certificate",                       "Approved Training Institute"),
    ],
    "Chief Officer": [
        ("Certificate of Competency - Chief Mate (STCW II/2)",   "Maritime Administration"),
        ("Medical Certificate (ENG1)",                             "Approved Medical Examiner"),
        ("STCW Basic Safety Training (VI/1)",                     "Maritime Training Centre"),
        ("GMDSS General Operator Certificate",                    "Maritime Authority"),
        ("Advanced Fire Fighting (STCW VI/3)",                    "Maritime Training Centre"),
        ("Proficiency in Survival Craft (STCW VI/2)",             "Maritime Training Centre"),
        ("ECDIS Type-Specific Certificate",                       "Approved Training Institute"),
    ],
    "Second Officer": [
        ("Certificate of Competency - OOW Navigation (STCW II/1)", "Maritime Administration"),
        ("Medical Certificate (ENG1)",                              "Approved Medical Examiner"),
        ("STCW Basic Safety Training (VI/1)",                      "Maritime Training Centre"),
        ("GMDSS General Operator Certificate",                     "Maritime Authority"),
        ("ECDIS Type-Specific Certificate",                        "Approved Training Institute"),
    ],
    "Chief Engineer": [
        ("Certificate of Competency - Chief Engineer (STCW III/2)", "Maritime Administration"),
        ("Medical Certificate (ENG1)",                               "Approved Medical Examiner"),
        ("STCW Basic Safety Training (VI/1)",                       "Maritime Training Centre"),
        ("High Voltage Awareness Certificate",                      "Maritime Training Centre"),
    ],
    "Second Engineer": [
        ("Certificate of Competency - Second Engineer (STCW III/2)", "Maritime Administration"),
        ("Medical Certificate (ENG1)",                                "Approved Medical Examiner"),
        ("STCW Basic Safety Training (VI/1)",                        "Maritime Training Centre"),
    ],
    "ETO": [
        ("Electro-Technical Officer Certificate (STCW III/6)",   "Maritime Administration"),
        ("Medical Certificate (ENG1)",                             "Approved Medical Examiner"),
        ("STCW Basic Safety Training (VI/1)",                     "Maritime Training Centre"),
        ("GMDSS General Operator Certificate",                    "Maritime Authority"),
    ],
    "Cook": [
        ("Ship Cook Certificate",                                 "Maritime Administration"),
        ("Medical Certificate (ENG1)",                             "Approved Medical Examiner"),
        ("STCW Basic Safety Training (VI/1)",                     "Maritime Training Centre"),
        ("Food Hygiene & Safety Certificate",                     "Health Authority"),
    ],
    "Bosun": [
        ("STCW Basic Safety Training (VI/1)",                     "Maritime Training Centre"),
        ("Medical Certificate (ENG1)",                             "Approved Medical Examiner"),
        ("Proficiency in Survival Craft (STCW VI/2)",             "Maritime Training Centre"),
        ("Advanced Fire Fighting (STCW VI/3)",                    "Maritime Training Centre"),
    ],
    "Able Seaman": [
        ("STCW Basic Safety Training (VI/1)",                     "Maritime Training Centre"),
        ("Medical Certificate (ENG1)",                             "Approved Medical Examiner"),
        ("Proficiency in Survival Craft (STCW VI/2)",             "Maritime Training Centre"),
    ],
    "Ordinary Seaman": [
        ("STCW Basic Safety Training (VI/1)",                     "Maritime Training Centre"),
        ("Medical Certificate (ENG1)",                             "Approved Medical Examiner"),
    ],
}

# ── Name pools (15 nationalities) ────────────────────────────────────────────

NAMES = {
    "Filipino": (
        ["Jose","Marco","Eduardo","Ricardo","Emmanuel","Ramon","Antonio","Fernando",
         "Christian","Michael","Jaime","Roberto","Renato","Florante","Danilo"],
        ["Santos","Cruz","Garcia","Reyes","Dela Cruz","Espiritu","Bautista","Ramos",
         "Aquino","Mendoza","Navarro","Castillo","Gonzales","Torres","Flores"],
    ),
    "Indian": (
        ["Rajesh","Sunil","Deepak","Amit","Vikram","Pradeep","Sanjay","Arun","Ravi",
         "Arjun","Naveen","Manish","Sachin","Rohit","Ganesh"],
        ["Sharma","Patel","Singh","Kumar","Gupta","Mehta","Nair","Pillai","Rao",
         "Verma","Joshi","Mishra","Reddy","Iyer","Menon"],
    ),
    "Ukrainian": (
        ["Oleksandr","Mykola","Dmytro","Vasyl","Serhiy","Andriy","Volodymyr","Bohdan",
         "Taras","Roman","Yurii","Maksym","Oleh","Viktor","Denys"],
        ["Kovalenko","Melnyk","Shevchenko","Kravchenko","Bondarenko","Tkachenko",
         "Kovalchuk","Marchenko","Savchenko","Petrenko","Moroz","Lysenko","Hrytsenko"],
    ),
    "Russian": (
        ["Vladimir","Sergei","Alexei","Mikhail","Dmitri","Pavel","Nikolai","Andrei",
         "Evgeny","Konstantin","Anatoly","Boris","Gennady","Leonid"],
        ["Ivanov","Petrov","Sidorov","Smirnov","Kuznetsov","Popov","Volkov","Sokolov",
         "Mikhailov","Novikov","Fedorov","Morozov","Kozlov","Stepanov"],
    ),
    "Chinese": (
        ["Wei","Ming","Jian","Hao","Lei","Peng","Qiang","Fang","Jun","Gang",
         "Liang","Tao","Bin","Hui","Dong"],
        ["Chen","Wang","Li","Zhang","Liu","Yang","Huang","Zhao","Wu","Zhou",
         "Xu","Sun","Ma","Zhu","He"],
    ),
    "Indonesian": (
        ["Budi","Eko","Agus","Bambang","Hendra","Wawan","Dedi","Yusuf","Ridwan",
         "Haris","Fajar","Wahyu","Arif","Doni","Irwan"],
        ["Santoso","Wijaya","Suharto","Kusuma","Pratama","Putra","Susilo","Nugroho",
         "Raharjo","Surya","Wibowo","Setiawan","Hermawan"],
    ),
    "Myanmarese": (
        ["Kyaw","Thein","Aung","Zaw","Win","Ko","Mg","Htet","Naing","Ye",
         "Soe","Myo","Pyae","Thet","Htun"],
        ["Oo","Naing","Lwin","Htun","Myint","Aung","Kyaw","Thein","Zin","Tun",
         "Win","Moe","Phyo","Hlaing"],
    ),
    "Croatian": (
        ["Tomislav","Marko","Ivan","Nikola","Mario","Ante","Josip","Stjepan",
         "Branko","Davor","Mladen","Zlatko","Goran","Pero","Hrvoje"],
        ["Horvat","Kovac","Babic","Maric","Petrovic","Juric","Vukovic","Tomic",
         "Popovic","Knezevic","Novak","Simic","Blazevic"],
    ),
    "Greek": (
        ["Konstantinos","Nikolaos","Georgios","Dimitrios","Christos","Alexandros",
         "Ioannis","Panagiotis","Athanasios","Spyridon","Vasileios","Michalis"],
        ["Papadopoulos","Nikolaou","Alexiou","Georgiou","Dimitriou","Christodoulou",
         "Stavros","Antonopoulos","Anagnostopoulos","Papadimitriou"],
    ),
    "Romanian": (
        ["Ion","Vasile","Constantin","Alexandru","Mihai","Nicolae","Florin","Bogdan",
         "Cristian","Andrei","Gabriel","Daniel","Marian","Iulian"],
        ["Popescu","Ionescu","Popa","Stan","Moldovan","Stoica","Constantin","Marin",
         "Dumitrescu","Gheorghe","Matei","Dima","Lungu"],
    ),
    "Polish": (
        ["Marek","Tomasz","Krzysztof","Piotr","Andrzej","Michal","Grzegorz","Pawel",
         "Marcin","Lukasz","Jacek","Rafal","Dariusz","Wojciech"],
        ["Kowalski","Wisniewski","Wojcik","Kowalczyk","Kaminski","Lewandowski",
         "Zielinski","Wozniak","Szymanski","Dabrowski","Nowakowski"],
    ),
    "Egyptian": (
        ["Mohamed","Ahmed","Ali","Hassan","Ibrahim","Mahmoud","Khaled","Youssef",
         "Amr","Tarek","Walid","Hisham","Adel","Sherif"],
        ["Hassan","Ibrahim","El-Sayed","Khalil","Mansour","Abdel-Rahman",
         "El-Rashidy","Farouk","El-Masry","Salem","El-Amin","Nour"],
    ),
    "Turkish": (
        ["Mehmet","Ahmet","Mustafa","Ali","Huseyin","Ibrahim","Omer","Hasan",
         "Murat","Emre","Fatih","Burak","Serkan","Ozan"],
        ["Yilmaz","Kaya","Demir","Sahin","Celik","Yildiz","Ozturk","Aydin",
         "Arslan","Dogan","Kilic","Aslan","Bulut"],
    ),
    "Pakistani": (
        ["Muhammad","Ali","Hassan","Umar","Tariq","Imran","Asif","Zubair",
         "Faisal","Arshad","Naeem","Aqeel","Rashid","Bilal"],
        ["Khan","Malik","Ahmed","Hussain","Iqbal","Chaudhry","Sheikh","Mirza",
         "Siddiqui","Baig","Raza","Butt","Nawaz"],
    ),
    "British": (
        ["James","Thomas","Robert","William","John","David","Andrew","Richard",
         "Peter","Michael","Stephen","Mark","Christopher","Jonathan"],
        ["Smith","Jones","Williams","Brown","Taylor","Davies","Evans","Wilson",
         "Thomas","Roberts","Johnson","Walker","Wright","Hall"],
    ),
}

NATIONALITY_LIST = list(NAMES.keys())
_nat_idx = {n: 0 for n in NATIONALITY_LIST}


def next_name(nationality: str) -> str:
    firsts, lasts = NAMES[nationality]
    i = _nat_idx[nationality]
    name = f"{firsts[i % len(firsts)]} {lasts[i % len(lasts)]}"
    _nat_idx[nationality] += 1
    return name


def expiry_days(crew_idx: int, cert_rank: int) -> int:
    """
    Return days-until-expiry (negative = already expired).
    cert_rank 0 = primary cert (CoC), 1 = medical, 2+ = other.
    Distribution applied to ranks 0 and 1; rank 2+ always valid.
    """
    bucket = crew_idx % 100
    if cert_rank >= 2:
        return random.randint(120, 1825)

    if cert_rank == 0:          # primary professional cert
        if bucket < 75:
            return random.randint(91, 1825)
        elif bucket < 90:
            return random.randint(30, 90)
        elif bucket < 97:
            return random.randint(1, 29)
        else:
            return -random.randint(1, 45)
    else:                       # medical cert
        if bucket < 82:
            return random.randint(91, 730)
        elif bucket < 94:
            return random.randint(20, 90)
        else:
            return -random.randint(1, 20)


def build_certs(crew_obj, crew_idx: int) -> list:
    position = crew_obj.position
    specs = CERT_SPECS.get(position, CERT_SPECS["Ordinary Seaman"])
    certs = []
    for rank, (cert_type, authority) in enumerate(specs):
        days = expiry_days(crew_idx, rank)
        expiry = TODAY + timedelta(days=days)
        issue  = expiry - timedelta(days=5 * 365)
        certs.append(Certificate(
            crew_id=crew_obj.id,
            certificate_type=cert_type,
            issue_date=issue,
            expiry_date=expiry,
            issuing_authority=authority,
            ratings=[],
            endorsements=[],
        ))
    return certs


def alert_for(crew_obj, cert_type: str, expiry: date):
    days = (expiry - TODAY).days
    if days < 0:
        severity = "high"
        msg = (f"{crew_obj.name} — {cert_type} EXPIRED {abs(days)} days ago. "
               "Crew member cannot sail until renewed.")
    elif days < 30:
        severity = "high"
        msg = (f"{crew_obj.name} — {cert_type} expires in {days} day(s). "
               "Urgent renewal required.")
    else:
        severity = "medium"
        msg = (f"{crew_obj.name} — {cert_type} expires in {days} days. "
               "Schedule renewal.")
    return Alert(
        crew_id=crew_obj.id,
        alert_type="Certificate Expiry",
        severity=severity,
        message=msg,
        resolved=False,
    )


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        if "--reset" in sys.argv:
            print("Resetting demo data...")
            db.query(Alert).delete()
            db.query(CrewAssignment).delete()
            db.query(Certificate).delete()
            db.query(Crew).delete()
            db.query(Vessel).filter(Vessel.imo.in_(DEMO_IMOS)).delete(synchronize_session=False)
            db.commit()
            print("  ✓ Cleared\n")
        elif db.query(Vessel).filter(Vessel.imo == "9123456").first():
            print("Demo data already exists. Run: python seed_demo.py --reset")
            return

        print("Seeding demo fleet data...")

        # ── Vessels ───────────────────────────────────────────────────────
        vessels = []
        for vd in VESSELS_DATA:
            v = Vessel(status="active", **vd)
            db.add(v)
            vessels.append(v)
        db.flush()
        print(f"  ✓ {len(vessels)} vessels")

        # ── Crew ──────────────────────────────────────────────────────────
        all_crew = []
        emp_no = 1

        def make_crew(nat_idx: int, position: str, status: str) -> Crew:
            nonlocal emp_no
            nat = NATIONALITY_LIST[nat_idx % len(NATIONALITY_LIST)]
            c = Crew(
                name=next_name(nat),
                employee_id=f"EMP{emp_no:04d}",
                nationality=nat,
                position=position,
                status=status,
                email=f"crew{emp_no:04d}@marinefleet.com",
                phone=f"+{random.randint(10,99)}{random.randint(100000000,999999999)}",
            )
            db.add(c)
            emp_no += 1
            return c

        # 55 onboard  — 11 per vessel
        onboard: list[tuple] = []           # (crew, vessel, position)
        for vi, vessel in enumerate(vessels):
            for pi, pos in enumerate(BILLET_POSITIONS):
                c = make_crew(vi * 11 + pi, pos, "onboard")
                onboard.append((c, vessel, pos))
                all_crew.append(c)

        # 80 on leave — 16 per vessel
        on_leave: list[tuple] = []          # (crew, vessel, position)
        for vi, vessel in enumerate(vessels):
            for li in range(16):
                pos = BILLET_POSITIONS[li % len(BILLET_POSITIONS)]
                c = make_crew(55 + vi * 16 + li, pos, "leave")
                on_leave.append((c, vessel, pos))
                all_crew.append(c)

        # 70 available — general pool
        available: list = []
        for ai in range(70):
            pos = BILLET_POSITIONS[ai % len(BILLET_POSITIONS)]
            c = make_crew(135 + ai, pos, "available")
            available.append(c)
            all_crew.append(c)

        db.flush()
        print(f"  ✓ {len(all_crew)} crew  "
              f"({len(onboard)} onboard / {len(on_leave)} on leave / {len(available)} available)")

        # ── Certificates + alert candidates ───────────────────────────────
        alert_candidates: list[tuple] = []  # (crew, cert_type, expiry_date)
        cert_count = 0
        for idx, crew in enumerate(all_crew):
            certs = build_certs(crew, idx)
            for c in certs:
                db.add(c)
                days_left = (c.expiry_date - TODAY).days
                if days_left < 90:
                    alert_candidates.append((crew, c.certificate_type, c.expiry_date))
            cert_count += len(certs)
        db.flush()
        print(f"  ✓ {cert_count} certificates")

        # ── Assignments ───────────────────────────────────────────────────
        assign_count = 0

        for crew, vessel, pos in onboard:
            start = NOW - timedelta(days=random.randint(30, 150))
            end   = start + timedelta(days=random.randint(150, 270))
            db.add(CrewAssignment(
                crew_id=crew.id, vessel_id=vessel.id, position=pos,
                assignment_date=start, expected_end_date=end, status="active",
            ))
            assign_count += 1

        for crew, vessel, pos in on_leave:
            start = NOW - timedelta(days=random.randint(270, 540))
            end   = start + timedelta(days=random.randint(150, 270))
            db.add(CrewAssignment(
                crew_id=crew.id, vessel_id=vessel.id, position=pos,
                assignment_date=start, expected_end_date=end, status="completed",
            ))
            assign_count += 1

        for i, crew in enumerate(available[:40]):
            vessel = vessels[i % len(vessels)]
            start  = NOW - timedelta(days=random.randint(540, 900))
            end    = start + timedelta(days=random.randint(120, 250))
            db.add(CrewAssignment(
                crew_id=crew.id, vessel_id=vessel.id, position=crew.position,
                assignment_date=start, expected_end_date=end, status="completed",
            ))
            assign_count += 1

        db.flush()
        print(f"  ✓ {assign_count} assignments")

        # ── Alerts ────────────────────────────────────────────────────────
        for crew, cert_type, expiry in alert_candidates:
            db.add(alert_for(crew, cert_type, expiry))

        db.commit()
        print(f"  ✓ {len(alert_candidates)} alerts")

        print("\nDemo data ready.")
        print(f"  Fleet   : {len(vessels)} vessels  "
              f"({', '.join(v.vessel_type for v in vessels)})")
        print(f"  Seafarers: {len(all_crew)} total  "
              f"({len(onboard)} onboard · {len(on_leave)} on leave · {len(available)} available)")
        print(f"  Certs   : {cert_count}   Alerts: {len(alert_candidates)}")
        print(f"  Nationalities: {', '.join(NATIONALITY_LIST)}")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    main()
