# Log-LenX
<img width="1470" height="834" alt="image" src="https://github.com/user-attachments/assets/b8d60cef-0402-4426-8348-bf4efa13c5c8" />

**Find the signal. Prioritize what matters.**


Log-LenX is a log analysis and incident triage prototype created by **Team Hack Heist** for **BST Protothon 2026**. It helps developers turn large volumes of application logs into grouped, prioritized incidents for faster investigation.

## Problem

During service outages, thousands of repeated log messages make it difficult to identify important failures, affected services, and likely root causes.

## Our Solution

Log-LenX analyzes raw application logs and presents a clear incident overview with:

- Automatic grouping of similar errors (Drain-style clustering)
- Incident priority and impact ranking
- Log explorer, timelines, and service insights
- Likely root-cause clues and suggested remediation steps
- Incident resolve/reopen controls and JSON report export
- Sample 10,000-line dataset for demonstration

**Workflow:** Upload or paste logs → Parse → Cluster → Rank → Investigate

> **Note:** This is a hackathon prototype. Some dashboards and integration statuses use demo data; marking an incident resolved does not fix external systems automatically.

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS
- **Backend:** Node.js, Express
- **Analysis:** Log parsing, Drain-style clustering, impact ranking

## Run Locally


Open **https://log-lenx.vercel.app** in your browser.

## Project Presentation

📄 **[View our 6-slide Hackathon Presentation (PDF)](https://linkjar.to/2d28fb92/)**

The presentation covers the problem, solution, workflow, prototype, expected impact, and future scope.

## Team Hack Heist

Team ID: 2392608226-Hack Heist
**Event:** BST Protothon, October 2026

| Team Member | USN |

Shahib Alam Saifi :- 2392608179  |
 Dharsandia Dishin :- 2392608226  |
 Sayak Mitra :- 2392608050  |
 Aryan Singh :- 2392608128  |
 Shivam Kumar Gupta :- 2392608007

## Repository

[GitHub — Log-LenX](https://github.com/Shahib-Alam-Saifi/Log-LenX)

---

## Future Improvements & Contributions

Log-LenX is currently a working prototype, and there is still room for improvement. We welcome developers to contribute and help make this project better.

Some features that can be added or improved:

- **Real-Time Log Monitoring:** Automatically collect and analyze live application logs.
- **AI Integration:** Improve Gemini AI integration for accurate root-cause analysis and intelligent suggestions.
- **Database Integration:** Store logs, incidents, and analysis history permanently.
- **Smart Alerts:** Send notifications through email, Slack, or other platforms when critical errors occur.
- **More Integrations:** Connect with tools like Docker, Kubernetes, and cloud monitoring services.
- **Automated Testing:** Add more test cases to improve accuracy, stability, and performance.
- **Security:** Add user authentication and secure API access.
- **Dashboard Improvements:** Improve charts, mobile responsiveness, and user experience.

### How to Contribute

We welcome contributions from everyone!

1. Fork this repository.
2. Create a new branch.
3. Make your improvements or fix bugs.
4. Test your changes.
5. Submit a pull request explaining your changes.

**Our Goal:** To make Log-LenX a more reliable, intelligent, and developer-friendly log analysis platform.

All ideas, suggestions, bug reports, and contributions are welcome!

**Built by Team - Hack Heist · Bosscoder School of Technology**
