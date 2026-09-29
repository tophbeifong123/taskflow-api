pipeline {
    agent any

    environment {
        APP_NAME = 'taskflow-api'
        NODE_ENV = 'test'
    }

    options {
        timeout(time: 15, unit: 'MINUTES')
    }

    stages {
        stage('Install') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Lint') {
            steps {
                sh 'npm run lint'
            }
        }

        // Task 1: Unit Test & Coverage
        stage('Unit Test') {
            steps {
                sh 'npm test -- --coverage --reporters=jest-junit'
            }
        }

        // Task 3: Static Analysis via SonarQube
        stage('SonarQube Analysis') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    sh 'sonar-scanner -Dsonar.projectKey=taskflow-api'
                }
            }
        }

        // Task 4: Quality Gate Threshold Check (> 70%)
        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // Task 5: End-to-End Suite via Playwright
        stage('E2E Test') {
            steps {
                sh '''
                    # เปิดเซิร์ฟเวอร์ Express API เบื้องหลัง
                    PORT=3000 node index.js &
                    API_PID=$!
                    sleep 3

                    # รันการทดสอบ Playwright E2E
                    npx playwright test

                    # ปิดเซิร์ฟเวอร์หลังทดสอบเสร็จ
                    kill $API_PID || true
                '''
            }
        }
    }

    post {
        always {
            // รวบรวมผลลัพธ์ JUnit ทั้งหมด (ทั้ง Unit test และ E2E test)
            junit testResults: 'reports/*.xml', allowEmptyResults: true
            
            // Task 5 Deliverable: บันทึกโฟลเดอร์รายงาน HTML ของ Playwright เป็น Artifact
            archiveArtifacts artifacts: 'playwright-report/**', allowEmptyArchive: true
            archiveArtifacts artifacts: 'coverage/**', allowEmptyArchive: true
        }
        success {
            echo "✅ All gates passed (Unit Test, Quality Gate, E2E) on ${env.NODE_ENV}"
        }
        failure {
            echo "❌ Failed at stage: ${env.STAGE_NAME}"
        }
    }
}