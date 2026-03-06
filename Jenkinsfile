pipeline {
  agent any

  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Check schema: FIO is VARCHAR') {
      steps {
        sh 'chmod +x ci/check-fio-varchar.sh'
        sh './ci/check-fio-varchar.sh'
      }
    }
  }
}
