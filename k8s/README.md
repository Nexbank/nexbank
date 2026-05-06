# Kubernetes Deployment

Apply the manifests in this order:

```bash
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/mongodb.yaml
kubectl apply -f k8s/backend.yaml
kubectl apply -f k8s/frontend.yaml
```

For Minikube image loading:

```bash
docker build -t nexbank-backend:latest ./server
docker build --build-arg REACT_APP_API_BASE_URL=https://nexbank-backend-o3kz.onrender.com/api -t nexbank-frontend:latest ./client
minikube image load nexbank-backend:latest
minikube image load nexbank-frontend:latest
```

Useful verification commands:

```bash
kubectl get pods -n nexbank
kubectl get svc -n nexbank
kubectl logs deployment/backend -n nexbank
kubectl scale deployment backend --replicas=3 -n nexbank
kubectl scale deployment frontend --replicas=3 -n nexbank
kubectl rollout status deployment/backend -n nexbank
kubectl rollout status deployment/frontend -n nexbank
minikube service frontend -n nexbank --url
```

For OpenShift, expose the frontend service after applying the manifests:

```bash
oc expose service/frontend -n nexbank
oc get route -n nexbank
```
