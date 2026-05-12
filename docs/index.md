# NexBank Project Documentation

## Final Submission Links

- [Week 4 Monitoring, Optimization, and Presentation](week4-monitoring.md)
- [Kubernetes Deployment Notes](../k8s/README.md)
- [Main Project README](../README.md)

## System Diagram

```mermaid
flowchart TB
  subgraph Client
    React[React Banking UI]
  end

  subgraph API
    Express[Express Backend]
    Metrics[/Metrics Endpoint/]
  end

  subgraph Data
    MongoDB[(MongoDB)]
  end

  subgraph Observability
    Prometheus[Prometheus]
    Grafana[Grafana]
  end

  React --> Express
  Express --> MongoDB
  Express --> Metrics
  Prometheus --> Metrics
  Grafana --> Prometheus
```

Use GitHub Pages with the repository `docs/` folder as the publishing source to share this documentation as a simple project site.
