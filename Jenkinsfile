pipeline {
    agent {
        docker {
            image 'node:20-alpine'
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
        stage('Install') {
            steps {
                echo "Installing dependencies for ${env.APP_NAME} in environment: ${env.NODE_ENV}..."
                sh 'npm ci'
            }
        }
        stage('Lint') {
            steps {
                echo "Running code linter..."
                sh 'npm run lint'
            }
        }
        stage('Unit Test') {
            steps {
                echo "Executing unit tests..."
                sh 'npm test'
            }
        }
    }

    post {
        success {
            echo "✅ ${env.APP_NAME} passed on ${env.NODE_ENV}"
        }
        failure {
            echo "❌ Failed at stage: ${env.STAGE_NAME}"
        }
        always {
            archiveArtifacts artifacts: 'npm-debug.log*', allowEmptyArchive: true
        }
    }
}