# Project Governance

## AI Attribution
This repository is primarily authored by **Claude Code CLI**. 
- **Mode:** Autonomous (Bypass Permissions enabled)
- **Environment:** Isolated Ubuntu 26.04 LTS VM (Hardened)
- **Human Oversight:** Architectural review and final commit approval only.

## Security Model
To mitigate "Bypass Mode" risks, this project is developed in a sandbox:
- **Network:** UFW restricted to essential ports.
- **FS:** Limited to `/var/www/guestly`.
- **Identity:** Dedicated `claude-bot` user without `sudo` privileges.
