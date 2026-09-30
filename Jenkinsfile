pipeline {
    agent any

    environment {
        AWS_ACCESS_KEY_ID     = 'test'
        AWS_SECRET_ACCESS_KEY = 'test'
        AWS_DEFAULT_REGION    = 'us-east-1'
    }

    options {
        timeout(time: 20, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // Task 2: Parallel Lint & Validation
        stage('IaC Lint & Validate') {
            parallel {
                stage('Terraform Validate') {
                    steps {
                        dir('infra/terraform') {
                            sh 'terraform init -backend=false'
                            sh 'terraform validate'
                            sh 'terraform fmt -check -recursive'
                        }
                    }
                }
                stage('Ansible Lint') {
                    steps {
                        sh 'ansible-lint infra/ansible/playbook.yml || true'
                    }
                }
            }
        }

        // Task 3: Security Scan via tfsec & checkov
        stage('IaC Security Scan') {
            steps {
                dir('infra/terraform') {
                    sh 'tfsec . --format text --soft-fail > tfsec-report.txt || true'
                    sh 'checkov -d . --output cli --soft-fail > checkov-report.txt || true'
                }
            }
        }

        // Task 4: Plan & Archive Plan File
        stage('Terraform Plan') {
            steps {
                dir('infra/terraform') {
                    sh 'terraform init -reconfigure'
                    sh 'terraform plan -out=tfplan'
                    sh 'terraform show -no-color tfplan > plan-summary.txt'
                }
            }
        }

        // Task 4: Human Approval Gate (ห้าม apply อัตโนมัติ)
        stage('Approval Gate') {
            steps {
                input message: 'Approve Terraform Apply to provision infrastructure?'
            }
        }

        // Task 4: Terraform Apply
        stage('Terraform Apply') {
            steps {
                dir('infra/terraform') {
                    sh 'terraform apply -input=false tfplan'
                    sh 'terraform output -json > output.json'
                }
            }
        }

        // Task 5: Configure Host with Ansible
        stage('Configure with Ansible') {
            steps {
                script {
                    echo "Running Ansible Playbook on provisioned infrastructure..."
                    sh 'ansible-playbook -i "localhost," -c local infra/ansible/playbook.yml'
                }
            }
        }
    }

    post {
        always {
            // Archive Plan, Scan Reports และ Outputs เป็น Deliverables
            archiveArtifacts artifacts: 'infra/terraform/tfplan, infra/terraform/plan-summary.txt, infra/terraform/*-report.txt, infra/terraform/output.json', allowEmptyArchive: true
        }
        success {
            echo "✅ Lab 08: Infrastructure provisioned and configured successfully!"
        }
        failure {
            echo "❌ Pipeline failed at stage: ${env.STAGE_NAME}"
        }
    }
}