package security

import rego.v1

default allow := false

# อนุญาตให้ผ่านเฉพาะเมื่อไม่มีข้อความใน deny list
allow if {
    count(deny) == 0
}

# สกัดกั้นทันทีหาก npm audit รายงานช่องโหว่ระดับ critical มากกว่า 0
deny contains msg if {
    critical := input.metadata.vulnerabilities.critical
    critical > 0
    msg := sprintf("Policy Violation: Found %v critical dependencies vulnerabilities!", [critical])
}
