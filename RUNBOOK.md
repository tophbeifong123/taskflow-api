# 🚨 Rollback Runbook: Production Incident Response

**Document Version:** 1.0  
**Target Applications:** `taskflow-api` & `taskflow-mobile`  
**Infrastructure Target:** Kubernetes (k3s) / Production Cluster  
**Role:** On-Call Site Reliability Engineer (SRE) / DevOps Engineer  

---

## 1. Incident Overview & Severity Levels

| Severity | Definition | Impact | Initial Response Target |
| :--- | :--- | :--- | :--- |
| **P1 - CRITICAL** | Production deployment failed, user-facing outage, health check failure, or Prometheus SLO breached (<90% success rate). | Total service degradation or 5xx error spikes | **Immediate (< 5 minutes)** |
| **P2 - HIGH** | Green deployment unhealthy before cutover, Pipeline Health Gate blocked release, or queue backlog alert firing. | Deployment halted, no user disruption | **Within 15 minutes** |

---

## 2. On-Call Engineer Immediate Checklist (< 5 mins)

1. **Acknowledge Alert:** Acknowledge alert in Prometheus Alertmanager or Slack notification channel.
2. **Halt Automated Deployments:** Cancel any pending or running Jenkins deployment builds on branch `main`.
3. **Inspect Current Traffic Distribution:** Identify which deployment (`blue` or `green`) currently handles live production traffic:
   ```bash
   kubectl get svc taskflow -o jsonpath='{.spec.selector.color}'
   ```
4. **Trigger Instant Traffic Cutback:** If Green deployment is unhealthy or errors exceed threshold, immediately revert service selector to known-good **Blue**:
   ```bash
   kubectl patch svc taskflow -p '{"spec":{"selector":{"color":"blue"}}}'
   ```

---

## 3. Step-by-Step Rollback Procedures

### Procedure A: Instant Blue/Green Cutback (Traffic Divert)
Use this procedure when user-facing errors are detected post-cutover:

```bash
# 1. Switch Production Service Selector back to Blue
kubectl patch svc taskflow -p '{"spec":{"selector":{"color":"blue"}}}'

# 2. Verify traffic routing has shifted
kubectl get svc taskflow -o jsonpath='{.spec.selector.color}'
# Expected Output: blue

# 3. Test HTTP Health Endpoint on Blue
kubectl run rollback-verify --image=curlimages/curl --rm -it --restart=Never -- \
  curl -s -I http://taskflow:8080/health
# Expected Status: HTTP/1.1 200 OK
```

### Procedure B: Drain & Quarantine Unhealthy Green Deployment
Prevent faulty Pods from consuming cluster resources:

```bash
# 1. Scale down the faulty Green Deployment to 0 replicas
kubectl scale deployment taskflow-green --replicas=0

# 2. Confirm terminating status of faulty pods
kubectl get pods -l app=taskflow,color=green

# 3. Preserve diagnostic logs before termination (if needed for RCA)
kubectl logs -l app=taskflow,color=green --tail=200 > /tmp/incident_green_logs.txt
```

### Procedure C: Pipeline Emergency Rollback Trigger (Git Revert)
If code defects must be removed from the deployment pipeline:

```bash
# 1. Identify the last stable commit on main
git log --oneline -n 5

# 2. Revert the problematic commit
git revert HEAD --no-edit

# 3. Push to main to trigger unified recovery pipeline
git push origin main
```

---

## 4. Diagnostic & Triage Guide

### 4.1 Triage Kubernetes Pods & Logs
```bash
# Inspect Pod status and restart counts
kubectl get pods -n default -o wide

# Describe pod events (look for OOMKilled, CrashLoopBackOff, ImagePullBackOff)
kubectl describe pod -l app=taskflow,color=green

# Stream live container logs
kubectl logs -f -l app=taskflow,color=green -c taskflow-api
```

### 4.2 Query Prometheus for Telemetry
```bash
# Check instantaneous queue size
curl -s "http://172.31.66.113:9090/api/v1/query?query=jenkins_queue_size_value"

# Query rolling build success rate
curl -s -G --data-urlencode 'query=sum(jenkins_builds_success_build_count_total)/sum(jenkins_builds_build_count_total)*100' \
  http://172.31.66.113:9090/api/v1/query
```

### 4.3 Grafana Observability Dashboard
Navigate to Grafana Dashboard (`http://localhost:3000/d/jenkins-slo-dashboard`):
- **Panel 1 (Success Rate):** Verify recovery above the 90% SLO threshold.
- **Panel 2 (p95 Latency):** Check for latency spikes (> 6 minutes).
- **Panel 3 (Queue Length):** Ensure build queue size drops back to 0.

---

## 5. Post-Incident Communication Template

**Slack / Email Broadcast Template:**

```text
🚨 [INCIDENT RESOLVED] - Production Rollback Completed
-----------------------------------------------------------
Application:     taskflow-api (k3s Cluster)
Incident ID:     INC-2026-0930-01
Severity:        P1 - Critical
Incident State:  RESOLVED / RESTORED TO STABLE (BLUE)
Trigger:         Production Health Gate Failure / Unhealthy Green Deployment
Mitigation:      Traffic selector patched back to color: blue. Faulty deployment scaled down.
Current Status:  Service fully operational. 100% of traffic on stable version.
Follow-up:       Post-Mortem meeting scheduled at 10:00 AM tomorrow.
-----------------------------------------------------------
```

---

## 6. Post-Mortem & Preventative Actions (PIR)

1. **Timeline Reconstruction:** Log exact timestamps of commit, alert trigger, cutback patch, and full recovery.
2. **Root Cause Analysis (RCA):** Determine failure category:
   - Bad container image / missing runtime dependencies
   - Memory leak / OOM limit breach
   - Security gate false negative / unhandled edge-case CVE
3. **Automated Gate Hardening:** Add pre-deploy integration smoke test in Jenkinsfile before cutover step.
