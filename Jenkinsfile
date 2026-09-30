pipeline {
    agent any

    environment {
        APP_NAME = 'taskflow-api'
        SHORT_SHA = "${env.GIT_COMMIT.take(7)}"
        IMAGE_NAME = "taskflow-api:${env.GIT_COMMIT.take(7)}"
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

        stage('Test & Build App') {
            steps {
                sh 'npm ci'
                sh 'npm test -- --coverage --reporters=jest-junit'
            }
        }

        // Task 1 & 2: Build Image with Immutable Tagging (ห้ามใช้ latest)
        stage('Build Container Image') {
            steps {
                echo "Building Docker Image: ${IMAGE_NAME}"
                sh "docker build -t ${IMAGE_NAME} ."
            }
        }

        // Task 3: Container Vulnerability Scanning via Trivy
        stage('Trivy Image Scan') {
            steps {
                script {
                    echo "🔍 Scanning image ${IMAGE_NAME} with Trivy..."
                    // สร้างรายงานสรุปแบบ Text และ JSON
                    sh "trivy image --severity HIGH,CRITICAL --format table ${IMAGE_NAME} > trivy-report.txt || true"
                    sh "trivy image --severity HIGH,CRITICAL --format json -o trivy-report.json ${IMAGE_NAME} || true"

                    // ตรวจสอบเกณฑ์ Gate (หากต้องการให้บล็อกเมื่อพบ CRITICAL ให้ใส่ exit-code 1)
                    sh "trivy image --exit-code 0 --severity CRITICAL ${IMAGE_NAME}"
                }
            }
        }

        // Task 4: Blue/Green Deployment to Green Environment
        stage('Deploy to Green') {
            steps {
                sh "chmod +x deploy/blue-green.sh"
                sh "./deploy/blue-green.sh ${IMAGE_NAME} green"
            }
        }

        // Task 5: Smoke Testing & Traffic Cutover
        stage('Traffic Cutover & Verification') {
            steps {
                echo "Verifying production endpoint response..."
                sh 'curl -s -f http://localhost:3002/tasks'
                echo "✅ Blue/Green Deployment Verified: Traffic routed to Green!"
            }
        }
    }

    post {
        always {
            // บันทึกผลรายงานความปลอดภัยของ Container เป็น Artifacts
            archiveArtifacts artifacts: 'trivy-report.*', allowEmptyArchive: true
            junit testResults: 'reports/*.xml', allowEmptyResults: true
        }
        success {
            echo "✅ Lab 07 Complete: ${IMAGE_NAME} deployed via Blue/Green with Zero Downtime!"
        }
        failure {
            echo "❌ Pipeline failed at stage: ${env.STAGE_NAME}"
        }
    }
}