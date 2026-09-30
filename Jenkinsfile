pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
metadata:
  labels:
    role: jenkins-agent
spec:
  containers:
  - name: node
    image: node:20-alpine
    command: ['cat']
    tty: true
'''
        }
    }

    environment {
        APP_NAME = 'taskflow-api'
        NODE_ENV = 'test'
    }

    options {
        timeout(time: 10, unit: 'MINUTES')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install & Test on K8s Pod') {
            steps {
                container('node') {
                    echo "🚀 Running inside dynamic ephemeral Kubernetes Pod!"
                    sh 'node --version'
                    sh 'npm ci'
                    sh 'npm test -- --coverage --reporters=jest-junit'
                }
            }
        }
    }

    post {
        always {
            junit testResults: 'reports/*.xml', allowEmptyResults: true
        }
        success {
            echo "✅ Dynamic Kubernetes Agent completed build successfully!"
        }
        failure {
            echo "❌ Pipeline failed at stage: ${env.STAGE_NAME}"
        }
    }
}