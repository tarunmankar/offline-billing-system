# Project Workflow Checklist

## 1) Pehle kya banana hai
- Ek naya project folder banao.
- Project path mein spaces avoid karo for better compatibility.
- Root mein `README.md` aur `.gitignore` banao.
- `README.md` mein mention karo ki AI ko pehle `.ai/` folder read karna hai.
- Ek hidden folder `.ai/` banao.
- `.ai/` ke andar ye files rakho:
  - `00_PRD.md`
  - `ARCHITECTURE_MASTER.md`
  - `SCHEMA.md`
  - `AGENTS.md`
  - `GEMINI.md`
  - `PROJECT_BLUEPRINT.md`
  - `TASKS.md`
  - `ERROR_LOGS.md`

## 2) Sabse important file
### `00_PRD.md`
Is file mein aap likho:
- Project ka naam aur vision
- Kaun use karega
- Web / desktop / mobile
- Tech stack
- Core features
- Strict rules
- Kya allowed hai aur kya nahi

End mein ek instruction zaroor likho:

`AI Instruction: Read this 00_PRD.md very carefully and generate the remaining foundation files based on these exact requirements.`

## 3) AI se kya karwana hai
`00_PRD.md` dene ke baad AI se bolo:
- `ARCHITECTURE_MASTER.md` banaye
- `SCHEMA.md` banaye
- `AGENTS.md` banaye
- `GEMINI.md` banaye
- `PROJECT_BLUEPRINT.md` banaye
- `TASKS.md` banaye

## 4) Har file ka kaam
### `ARCHITECTURE_MASTER.md`
Project ka main technical flow.

### `SCHEMA.md`
Database structure.

### `AGENTS.md`
AI ke rules.

### `GEMINI.md`
IDE aur environment rules.

### `PROJECT_BLUEPRINT.md`
Folders aur screens ka map.

### `TASKS.md`
Kaun sa kaam kis order mein hoga.

### `ERROR_LOGS.md`
Bugs aur fixes ka record.

Note:
- Start mein ye file empty rahegi.
- Sirf bug/fix ke baad update karna hai.

## 5) AI ko kaise chalana hai
Har task ke baad AI ko rukna chahiye.

Rule:
- Kaam complete ho
- Test status batao
- Phir poochho: next task shuru karun?

Yehi `Halt & Ask` rule hai.

## 6) Git / GitHub mein aapko kya karna hai
### Manual work
- `git init`
- remote repo connect karna
- feature branch create karna
- branch protection on karna
- pull request ke through merge karna
- `main` branch par direct work avoid karna

### Important safety rule
AI ko direct ye kaam automatically nahi karna chahiye:
- `git add`
- `git commit`
- `git push`
- `git merge`

Ye sab sirf aapke confirmation ke baad hona chahiye.

### AI GitHub Integration Rule
- Har task complete hone ke baad AI zaroor suggest karega: "Kaam pura ho gaya hai, isko commit aur push kar lijiye."
- Naye feature ya task ko start karne se pehle AI nayi branch banane (e.g. `feature/dynamic-forms`) ka suggestion dega.
- AI git commands run kar sakta hai lekin usko `SafeToAutoRun: false` rakhna hai taaki USER khud approve kare.

## 7) Working order
1. Folder setup
2. `.ai/` files banana
3. `00_PRD.md` fill karna
4. AI se foundation files generate karwana
5. `TASKS.md` ke hisaab se ek ek task karna
6. Har task ke baad test karna
7. `ERROR_LOGS.md` update karna
8. Branch par commit karna
9. GitHub PR banana
10. Merge karna

## 8) Simple final rule
Agar kuch unclear ho to AI ko aage nahi badhna chahiye.

Pehle report:
- kya banaya
- kya test hua
- kya pending hai

Phir permission lena chahiye.

## 9) Short version
**Aapka kaam:** vision, PRD, approval, testing, GitHub control.

**AI ka kaam:** structure, code, docs, task breakdown, bug memory.

---

## Ready-to-use prompt

`Read 00_PRD.md and create the remaining foundation files. Follow Halt & Ask rule. Do not git commit or push automatically. Report status after every task and wait for permission.`

