import os
import openpyxl

def generate_synthetic_data():
    wb = openpyxl.Workbook()
    # Remove default sheet
    default_sheet = wb.active
    wb.remove(default_sheet)
    
    # Create sheet '25-26'
    sheet = wb.create_sheet('25-26')
    
    # Write headers
    headers = ['Sr. No. ', 'PRN', 'STUDENT NAME (MENTEES)', 'DIV_YEAR_BRANCH', 'MENTORS AND DETAILS', None]
    sheet.append(headers)
    
    # Define synthetic mentors and their serial ranges
    mentors_details = {
        1: "Prof. Alice CSE, MAIL ID: alice.cse@mitwpu.edu.in, M: 9876543210, SERIAL NUMBERS: 1 TO 10",
        11: "Prof. Bob ECE, MAIL ID: bob.ece@mitwpu.edu.in, M: 8765432109, SERIAL NUMBERS: 11 TO 20",
        21: "Prof. Charlie CSE, MAIL ID: charlie.cse@mitwpu.edu.in, M: 7654321098, SERIAL NUMBERS: 21 TO 30",
        31: "Prof. Diana MECH, MAIL ID: diana.mech@mitwpu.edu.in, M: 6543210987, SERIAL NUMBERS: 31 TO 40",
        41: "Prof. Ethan CSE, MAIL ID: ethan.cse@mitwpu.edu.in, M: 5432109876, SERIAL NUMBERS: 41 TO 50"
    }
    
    # Append 50 rows of student data
    for sr_no in range(1, 51):
        prn = 1032250000 + sr_no
        name = f"Synthetic Student {sr_no}"
        
        # Distribute branches/divisions
        if sr_no <= 10:
            div_year_branch = "1 - FY CSE"
        elif sr_no <= 20:
            div_year_branch = "2 - FY ECE"
        elif sr_no <= 30:
            div_year_branch = "3 - FY CSE"
        elif sr_no <= 40:
            div_year_branch = "4 - FY MECH"
        else:
            div_year_branch = "5 - FY CSE"
            
        mentor_info = mentors_details.get(sr_no, None)
        
        sheet.append([sr_no, prn, name, div_year_branch, mentor_info, None])
        
    # Ensure directory exists
    os.makedirs(os.path.join("tests", "fixtures"), exist_ok=True)
    dest_path = os.path.join("tests", "fixtures", "synthetic_mentor_data.xlsx")
    wb.save(dest_path)
    print(f"[SUCCESS] Synthetic Excel fixture successfully generated at {dest_path}")

if __name__ == "__main__":
    generate_synthetic_data()
