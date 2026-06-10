# USFinCalc 开发路线图

> 最后更新：2026-06-10
> 本文件是 usfincalc.com 的产品/SEO/变现路线图，基于对线上代码的实际审计校准而成，按 ROI 排序。供逐项发起开发使用。

---

## 0. 现状快照（已核验代码，非估计）

| 维度 | 实际状态 |
|---|---|
| 计算器 | 5 个：mortgage / paycheck / auto-loan / rsu-tax / retirement，**各 1150–1280 字**深度解释 |
| Guides | hub + **6 篇文章**（740–857 字），含 Article + BreadcrumbList schema |
| 内链 | 每个计算器页 **3 张相关卡片**（2 工具 + 1 guide） |
| 法务页 | privacy-policy / terms-of-service / disclaimer / about / contact 齐全 |
| Schema | FAQPage×5、WebApplication×5、Article×6、BreadcrumbList×12、Organization、WebSite、CollectionPage |
| 合规 | Consent Mode v2（默认 denied）+ 同意横幅 + Cookie 设置入口 |
| 技术 | 纯静态、自托管字体（零外部调用）、clean URL、CLS-safe 广告位、时间戳/dateModified |
| 部署 | Cloudflare Pages git-push 自动部署 |
| **变现** | **AdSense 未通过审核**（ads.js `ENABLED=false`）— 收益为零的根因 |

**结论**：内容深度与技术基建已达"优质 AdSense 站"门槛，领先于外部评估报告的认知。真正瓶颈是 **(1) 变现闭环未打通** 与 **(2) About 缺真人署名的 E-E-A-T 短板**，而非"内容薄弱"。

---

## 1. 优先级总览

| 阶段 | 目标 | 周期 | 是否依赖审核 |
|---|---|---|---|
| **P0** | 打通变现 + 补 E-E-A-T | 本周 | 否 |
| **P1** | 扩借贷集群（学生贷款） | 审核期并行，2–4 周 | 否 |
| **P2** | 计算器规模化至 ~10 个 | 1–3 月 | 建议审核后 |
| **P3** | 流量飞轮 + 季节性运营 | 持续 | 审核后 |

执行顺序（用户指定）：先写本路线图 → About E-E-A-T → AdSense 申请时机 → 学生贷款计算器。

---

## 2. P0 — 打通变现 + 补 E-E-A-T（本周，ROI 最高）

### P0-1 升级 About 页 E-E-A-T
- 补真实自然人作者署名（名字或一致化笔名）、相关背景、方法论与数据更新承诺。
- 加 `Person` schema，并在各页 Article/WebApplication 的 `author` 中引用，把站点从匿名实体升级为可信作者实体。
- **不编造身份**——需用户提供可公开信息。
- **验收**：About 含具名作者 + 资质/背景 + 更新承诺；Person schema 通过 Rich Results Test；至少计算器页 author 指向该 Person。

### P0-2 提交 AdSense 申请
- 当前 19 页内容量、法务页、导航、原创性均已超审核门槛。
- 申请前跑一遍检查清单（见 §5）。
- **验收**：完成检查清单无红项；提交申请；记录提交日期。

---

## 3. P1 — 扩借贷集群（审核期并行）

### P1-1 学生贷款计算器
- 范围收窄：**联邦标准还款 + 提前还款/加速还清影响**。复用 `USFC.monthlyPayment`。
- **不做** IBR/SAVE/减免/联邦-私贷分支（v1）——用更强的免责声明替代规则复杂度（同"州税从简"哲学）。
- 全套 v2.0 约束：clean URL `/student-loan-calculator`、nav+footer+sitemap、FAQ/WebApplication schema、≥3 内链、数学交叉验证。
- **验收**：数学与独立验算一致；schema 通过；sitemap/nav/footer 已加；"相关计算器"卡片已配。

### P1-2 配套 guide
- 一篇长尾文章（如"联邦学生贷款标准还款 vs 提前还款省多少利息"），Article+Breadcrumb schema，向下链到计算器 + 同集群兄弟 guide。

---

## 4. P2 / P3 — 规模化与飞轮

### P2 计算器规模化（按 CPC 优先级，目标 ~10 个）
1. Capital Gains Tax Calculator（资本利得税）
2. Roth vs Traditional IRA Calculator
3. Home Affordability Calculator（购房承受力）
4. Budget Calculator（50/30/20）
- 每个配 1–2 篇长尾 guide，维持"工具+内容"闭环范式。
- **验收**：每个新计算器达到现有计算器同等标准（字数、schema、内链、数学验证）。

### P3 流量飞轮 + 季节性
- **季节性**：1–4 月税季主推 paycheck/rsu/capital-gains；9–11 月主推 mortgage/retirement。匹配广告主投放高峰，RPM 可升 30–60%。
- **外链**：r/personalfinance、Hacker News、Product Hunt 提交工具。
- **广告精调**：审核通过后，结果区**下方**放主广告单元（用户完成计算、注意力放松，CTR 最高）；先开 Auto Ads 收集 2–4 周数据再精调。
- **持续**：税率/数据年度更新时同步刷新 `Last updated` 与 `dateModified`。

---

## 5. AdSense 申请前检查清单

> 2026-06-10 全站核查结论：技术与内容面**零红项，可申请**。

- [x] 内容原创、有实质价值（19 页，单页 ≥740 字）
- [x] 必备法务页：隐私政策 / 服务条款 / 免责声明（含运营方 WisePath Technology LLC）
- [x] 清晰导航 + 页脚（nav + footer 全站一致，无孤儿页）
- [x] 隐私政策含第三方广告 cookie 说明 + 退出链接
- [x] Consent Mode v2 默认 denied
- [x] 无版权侵权 / 无禁止内容（全原创）
- [x] 无死链（29 个站内链接全部有对应文件）
- [x] sitemap 与页面一一对应（18:18），每页唯一 canonical + title + description
- [x] About/Contact 真实可联系（具名作者 Gong Baolin + LinkedIn + WisePath LLC）
- [ ] 本次部署生效后复核 usfincalc.com（About 署名显示、favicon 更新、HTTPS 正常）
- [ ] DNS TXT 验证 → Search Console 提交 sitemap.xml（建议申请前或并行）

> 注：AdSense 不强制要求最低流量，但有真实访问更稳妥。最优时机：本次部署生效 + sitemap 提交后即可提交申请。审核 1–14 天，期间可并行开发新计算器。

---

## 5b. AdSense 通过后激活步骤（⚠️ 通过后立刻执行，否则广告不投放）

获得真实 publisher ID（`ca-pub-XXXXXXXXXXXXXXXX`）后，三处同步修改：

1. **`/ads.txt`** — 把占位行的 `pub-XXXXXXXXXXXXXXXX` 替换为真实 ID（保留 `google.com, pub-..., DIRECT, f08c47fec0942fa0` 格式）。缺这行广告不投放，且 Search Console 会报 ads.txt 警告。
2. **`/assets/js/ads.js`** — 设 `PUBLISHER_ID = 'ca-pub-...'`（真实 ID）+ `ENABLED = true`。
3. **各页 `.ad-slot`** — 把 `data-ad-slot="0000000000"` 替换为 AdSense 后台的真实 slot ID（每个广告单元一个），或改用 Auto Ads。

> ads.js 文件头注释也记录了这套激活步骤，与此处保持一致。激活后用浏览器实测：同意横幅 → Accept → 广告脚本注入 → 广告位渲染。

---

## 6. 收益潜力（区间预估，依赖流量与审核）

| 阶段 | 月 PV | RPM | 月收益 |
|---|---|---|---|
| 当前（未变现） | — | — | \$0（ads 未启用） |
| 审核通过（5 工具 + 内容） | 1k–5k | \$8–15 | \$8–75 |
| 规模化（10+ 工具 + guide 矩阵） | 20k–50k | \$20–35 | \$400–1,750 |
| 成熟（含季节性 + 外链） | 100k+ | \$25–45 | \$2,500+ |

> 金融类 CPC 高（美国 RPM \$15–50），但 RPM 与流量均需实测，以上为行业区间参考，非承诺。
