pipeline {
    agent any

    environment {
        APP_NAME = 'taskflow-api'
        NODE_ENV = 'test'
        COSIGN_PASSWORD = ''
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // 1. Secrets Detection (Task 1)
        stage('Secrets Detection') {
            steps {
                sh 'gitleaks detect --source=. -v --no-git || true'
            }
        }

        // 2. SAST (Task 2)
        stage('SAST - ESLint & Semgrep') {
            steps {
                sh 'npx eslint --plugin security src/ || true'
                sh 'semgrep scan --config="p/owasp-top-ten" --config="p/nodejs" --json -o semgrep-report.json || true'
            }
        }

        // 3. SCA - npm audit with fail/warn threshold (Task 3)
        stage('SCA - npm audit') {
            steps {
                script {
                    sh 'npm audit --audit-level=high --json > audit.json || true'
                    def critical = sh(
                        script: "jq '.metadata.vulnerabilities.critical // 0' audit.json",
                        returnStdout: true
                    ).trim().toInteger()
                    
                    if (critical > 0) {
                        error("Blocking: ${critical} critical vulnerabilities found")
                    }
                    echo "SCA passed with 0 critical vulnerabilities (warnings allowed)"
                }
            }
        }

        // 4. Generate & Sign SBOM (Task 4)
        stage('Generate SBOM') {
            steps {
                // สร้าง SBOM มาตรฐาน CycloneDX
                sh 'syft . -o cyclonedx-json=bom.cdx.json'
                
                // ตรวจสอบและสร้างคีย์ถ้ายังไม่มี
                sh '''
                    if [ ! -f cosign.key ]; then
                        COSIGN_PASSWORD="" cosign generate-key-pair
                    fi
                '''
                
                // เซ็นชื่อกำกับ SBOM
                sh 'COSIGN_PASSWORD="" cosign sign-blob --yes --tlog-upload=false --key cosign.key --output-signature bom.cdx.json.sig bom.cdx.json'
            }
        }

        // 5. Policy Gate (Task 5)
        stage('Policy Gate') {
            steps {
                script {
                    def allowed = sh(
                        script: "opa eval --data policy/security.rego --input audit.json 'data.security.allow' | jq -r '.result[0].expressions[0].value'",
                        returnStdout: true
                    ).trim()

                    if (allowed != "true") {
                        error("Blocking: OPA Policy Gate violation! Critical CVE found.")
                    }
                    echo "✅ OPA Policy Gate Passed"
                }
            }
        }

        // 6. Build Stage
        stage('Build & Test') {
            steps {
                sh 'npm ci'
                sh 'npm test -- --coverage --reporters=jest-junit'
            }
        }
    }

    post {
        always {
            // บันทึกรายงาน SARIF, JSON, และ SBOM เป็น Artifacts
            archiveArtifacts artifacts: 'bom.cdx.json*, audit.json, semgrep-report.json', allowEmptyArchive: true
            junit testResults: 'reports/*.xml', allowEmptyResults: true
        }
        success {
            echo "✅ Shift-Left Security Pipeline passed all gates!"
        }
        failure {
            echo "❌ Failed at stage: ${env.STAGE_NAME}"
        }
    }
}