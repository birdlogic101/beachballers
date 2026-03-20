# Beachballers: Source of Truth

Beachballers is a turn-based, duel-based roguelike beach soccer video game. This
document serves as the definitive reference for its mechanics, systems, and
progression.

---

## 1. Project Overview

- **Genre**: Roguelike Soccer.
- **Theme**: Beach Soccer.
- **Core Loop**: The game proceeds through a series of 1v1 duels until the end
  of the match.
- **Turn-Based**: Gameplay is turn-based. The human player always acts first and
  can see the AI's intent.

---

## 2. Core Gameplay Loop

1. **Kickoff & Possession**: A coin toss (heads/tails) determines initial
   possession.
   - At kickoff, teams are positioned in row 3 (human/AI in 3C) or row 4
     (human/AI in 4A).
   - **Toss Winner**: Starts in possession. The first duel occurs in the
     winner's corresponding starting zone (**3C** for Human, **4A** for AI).
   - **Second Half**: The team that lost the initial coin toss starts in
     possession for the second half.
   - **After a Goal**: Possession is reset to the team that was just scored
     upon.
2. **Possession**: The team in possession initiates duels to progress toward the
   opponent's goal.
3. **The Duel**:
   - AI Intent is revealed (e.g., Press, Block, Dribble, Pass, Shoot).
   - Human player's move pool is filtered based on the AI intent.
   - Human player spends **Touch Units** on **Moves** to prepare.
   - Human player triggers an **Exit Action** (Dribble, Pass, Shoot) to resolve
     the duel.
4. **Resolution (The Dilemma)**:
   - **The Dilemma Display**: Before any action, the human sees their potential
     success range (e.g., **Pass 9-11**) directly compared to the **AI Intent**
     (e.g., **Press 7**). This is the core strategic "puzzle".
   - **Tactical Typography**: The base stat value is rendered **Bright** (high
     contrast), while the volatility range is **Dimmed** (lower opacity),
     emphasizing the most certain outcome (e.g.,
     **9**<span style="opacity:0.4; font-size:0.8em">-11</span>).
   - **Default Display**: The UI defaults to showing the **Pass** range.
   - **Hover Context**: Hovering over Dribble or Shoot updates the display to
     show that specific action's range.
   - **Defender Advantage**: In case of a tie, the **Defending Action** always
     wins.
   - **Volatility**: Human player values include a **Volatility Range** (default
     0-2). Only human actions are subject to volatility; AI actions are fixed.
   - **AI ASYMMETRY**: The AI uses a simplified internal system (Slay The Spire
     style). It has no Playbook, Heat, or Touch Units; its intent is a fixed
     outcome value or flat modifier.
5. **Outcome**: The duel results in ball movement, player rotation, or
   possession change.
6. **Match End**: The match duration is governed by a virtual clock.

---

## 3. The Field & Positioning

### Grid System

The field is a vertical grid divided into 6 rows (1-6) and 3 columns (A-B-C).

- **The Grid**:
  - **Row 1**: Human Goal (1B: **huGK** / Role: GK).
  - **Row 2**: Defensive Zone (2B: **huCB** / Role: CB).
  - **Row 3**: Midfield Defensive (3A or 3C: **huLB** or **huRB**).
  - **Row 4**: Midfield Offensive (4A or 4C: **huLW** or **huRW**).
  - **Row 5**: Attacking Zone (5B: **huCF** / Role: CF).
  - **Row 6**: AI Goal (6B: **aiGK** / Role: GK).
- **Temporal Roles**: A player's role is determined strictly by their current
  zone.
  - If a **Human Player** is in 3A/3C, they have the role **LB/RB**.
  - If an **AI Player** is in 3A/3C, they have the role **RW/LW** (attacking Row
    1).
  - **Requirement Logic**: All Heat/Stat requirements are tied to the **Role**
    currently held by the player in that zone.

### Positioning & Formation

- **Formation**: Staggered "Losange" (1 player per row). Both teams use a 1+4
  squad (1 GK + 4 field players).
- **1v1 Constriction (Dynamic Duel Shifting)**: The system ensures duels are
  always 1v1.
- **GK Zone Restriction**: Only the active attacker in a 1v1 Goal Duel can enter
  the opponent's GK zone (1B/6B).
- **Reset**: All players return to their kickoff zones after every goal.

### Kickoff player positions

- Both teams have 5 players on the field.
- Every player is assigned to a kickoff zone.
  - The Human GK (huGK) is assigned to 1B.
  - The AI GK (aiGK) is assigned to 6B.
  - The Human CB (huCB) is assigned to 2B.
  - The AI CB (aiCB) is assigned to 5B.
  - The Human RB (huRB) is assigned to 3C.
  - The AI RB (aiRB) is assigned to 4A.
  - The Human LW (huLW) is assigned to 4A.
  - The AI LW (aiLW) is assigned to 3C.
  - The Human CF (huCF) is assigned to 5B.
  - The AI CF (aiCF) is assigned to 2B.

### Player position determines player role

- Every zone gives the player a role.
  - If human player is in 1B, they are a GK.
  - If human player is in 2B, they are a CB.
  - If human player is in 3A, they are a LB.
  - If human player is in 3C, they are a RB.
  - If human player is in 4A, they are a LW.
  - If human player is in 4C, they are a RW.
  - If human player is in 5B, they are a CF.
  - If human player is in 6B, they are a GK.
  - If AI player is in 1B, they are a GK.
  - If AI player is in 2B, they are a CB.
  - If AI player is in 3A, they are a LB.
  - If AI player is in 3C, they are a RB.
  - If AI player is in 4A, they are a LW.
  - If AI player is in 4C, they are a RW.
  - If AI player is in 5B, they are a CF.
  - If AI player is in 6B, they are a GK.

---

## 4. Player Anatomy

### Base Stats

Every player has five primary statistics, plus Speed:

- **DRI (Dribbling)**: Used for Dribble exit actions.
- **PAS (Passing)**: Used for Pass exit actions.
- **SHO (Shooting)**: Used for Shoot exit actions.
- **AGG (Aggression)**: Used for Press defensive actions.
- **COM (Composure)**: Used for Block defensive actions.

### Speed & Touch Units

- **SPE (Speed)**: Defines the maximum **Touch Units (TU)** a player can spend
  per turn.
- **Minimum Value**: A player always has at least **3 Touch Units**, even if
  their SPE stat is lower.

### Volatility

Human player stats have a volatility range (Default: 0-2).

- **Player Stats**: Display **Fixed Base Stats** only (e.g., `11`) for visual
  clarity.
- **Dilemma Display**: Displays the **Potential Output Range** (e.g., `11-13`)
  using "Dimmed Volatility" typography.
- **Role**: Only human actions are subject to volatility; AI actions are fixed.

### Heat System (Prototype V1.0)

- **Bar Range**: Min -5 (Cold) | Max 10 (On Fire).
- **Start**: Default 0 at match kickoff. Persistent during match.
- **Increases**: Successful actions (+1) and certain moves.
- **Decreases**: Failed actions (-1) and certain moves.
- **Requirement**: Heat acts as a threshold for many actions (e.g., Shooting
  access).
- **GK Heat**: The human GK accumulates Heat exclusively through **saves** (+1
  per save). The GK also participates in field duels and therefore can gain/lose
  Heat through normal field actions.
- **UI Representation**: Displayed as large, prominent bars with a **numeric
  value overlay** (e.g., "HEAT: +2").

### Experience (XP) & Leveling

- **XP Gains**:
  - Goal Scored: +20 XP (Scorer).
  - Successful Assist: +20 XP (Passer).
  - Successful Action (Dribble/Pass/Press/Save): +5 XP.
  - Match Win: +50 XP (all participating players).
  - Match Draw: +20 XP (all participating players).
- **Leveling**:
  - Thresholds: 1->2 (100 XP), 2->3 (250 XP), etc.
  - Rewards: +1 to a random primary stat per level.
  - Level Cap: 20 (V1.0).

---

## 5. Duel Mechanics

### Lanes

Each duel occurs in a specific lane:

- **Inside Lane**: Closest to the center of the field. Goalkeepers are always
  "Inside" (visually center of goal).
- **Outside Lane**: Closest to the sidelines.
- **Assignment**: Defender is always assigned to the Inside lane; Attacker is
  randomly assigned either Inside or Outside.

### AI Intent & Reactionary Filter (STS Style)

The moves available to the human depend on the AI's current intent:

- **AI Intent: Press** -> Load **Red** moves (Press-counters).
- **AI Intent: Block** -> Load **Blue** moves (Block-counters).
- **AI Intent: Attack (Dribble/Pass/Shoot)** -> Load **Gray** moves (Defense).

### Move Pool Loading

The Carousel UI displays **all moves** currently available in the playbook that
match the AI intent filter. No limited hand-size for Prototype V1.0.

- **Progression Rewards**:
  - **Tier-1**: Replace an existing move.
  - **Tier-2**: Add a new move to the playbook.

---

## 6. Action Systems

### 6.1. Move Actions (Setup)

Non-exiting duel actions used for tactical setup.

- **Cost**: 0, 1, 2, 3, or X Touch Units (limited by SPE/Minimum 3).
- **Requirements**: Heat Threshold (Air/Ground state ignored for Prototype
  V1.0).
- **Effects**: Buffs (Stat bonuses for duel or match), Debuffs (value
  reduction).
- **Worldclass Moves**: Must provide tradeoffs, interact with Heat, or change
  based on context (lane/zone).

### 6.2. Exit Actions (Attacking)

Exit actions end the turn immediately. They **do not** cost Touch Units.

- **Dribble**:
  - **Constraint**: Locked if max human value < AI intent value, or if in the
    opponent's GK zone (6B).
  - **GK Rule**: Dribbling is **never possible** against a Goalkeeper (Zone 6B).
    The Dribble button is permanently locked in this zone.
- **Pass (The Dynamic System)**:
  - **Availability**: Available in Rows 1-5. **Locked in Zone 6B** (Opponent's
    GK zone).
  - **GK Rule (6B)**: Once in a Goal Duel, the attacker cannot pass. They must
    resolve with a **Shoot** action or potentially lose the ball to a GK tackle.
  - **Targeting (The Heat Driver)**: Your **current Heat** determines the target
    row:
    - **Heat < 0**: Pass back `X` rows (Capped at Row 1/Human GK).
    - **Heat > 0**: Pass forward `X` rows (Capped at Row 6/AI GK).
    - **Heat = 0 (The Lane Switch)**: Pass to the opposite column in the same
      row.
  - **Rotation Scenarios (The Ripple Effect)**:
    - **Logic**: A progression creates a vacuum. Teammates shift rows to fill it
      (The Ripple).
    - **Scenario A: High-Res Dribble (4C → 5B)**:
      - **Action**: **huRW** dribbles from 4C to 5B.
      - **Result**:
        - **huRW**: 4C → **5B** (Attacker). **aiCB** remains in 5B.
        - **huCF**: 5B → **4A** (Vacuum fill). **aiRW** moves from 3A to 4A.
        - **huCB**: 2B → **3C** (Support Shift). **aiLB** moves from 4C to 3C.
        - **huLB**: 3A → **2B** (Cover Shift). **aiCF** remains in 2B.
    - **Scenario B: huLB passes at Heat 0 (3A → 3C)**:
      - **Action**: **huLB** passes from 3A to receiver in 3C.
      - **Result**:
        - **huLB**: 3A → **4A**. **aiRW** moves from 3A to 4A.
        - **huRW** (receiver): 4C → **3C** (ball holder). **aiLB** moves from 4C
          to 3C.
        - **huCB**: remains in 2B. **aiCF** remains in 2B.
        - **huCF**: remains in 5B. **aiCB** remains in 5B.
    - **Scenario C: huCF (5B) passes at Heat 0 (The Tactical Hand-off)**:
      - **Action**: **huCF** passes from 5B to 5B (remaining in the zone).
      - **Result**:
        - **huRW** (receiver): 4C → **5B** (new CF). **aiCB** stays in 5B.
        - **huCF** (passer): 5B → **4A** (new LW). **aiRW** moves from 3A to 4A.
        - **huCB**: 2B → **3C** (new RB). **aiLB** moves from 4C to 3C.
        - **huLB**: 3A → **2B** (new CB). **aiCF** stays in 2B.
    - **Scenario D: huCB (2B) passes at Heat 0 (The Defensive Hand-off)**:
      - **Action**: **huCB** passes from 2B to 2B (remaining in the zone).
        Wide-range Ripple.
      - **Result**:
        - **huLB** (receiver): 3A → **2B** (new CB). **aiCF** stays in 2B.
        - **huCB** (passer): 2B → **3C** (new RB). **aiLB** moves from 4C to 3C.
        - **huCF**: 5B → **4A** (new LW). **aiRW** moves from 3A to 4A.
        - **huRW**: 4C → **5B** (new CF). **aiCB** stays in 5B.
    - **Scenario E: huGK (1B) passes at Heat 0 (The Roll-out)**:
      - **GK rules**: the GK's worst pass option is to pass to 2B. Even if his
        Heat is below 1, he will always pass to 2B.
      - **Action**: **huGK** passes from 1B to 2B.
      - **Result**: **Static**. huGK remains in 1B. huCB remains in 2B. (Fixed
        GK role).

- **Shoot**:
  - **Heat Requirements**: Access depends on zone:
    - GK (own) zone: 6 Heat. | CB zone: 5 Heat. | LB/RB zone: 4 Heat.
    - LW/RW zone: 3 Heat. | CF zone: 2 Heat. | Opponent's GK zone: 1 Heat.
  - **Constraint**: Locked if max human value < AI intent value.

### 6.3. Exit Actions (Defending)

- **Press**:
  - **Requirement**: Minimum 1 Heat.
  - **Resolution**: Success wins the ball immediately. Failure allows the AI to
    complete its action at full value.
- **Block**:
  - **Requirement**: Always available.
  - **Effect on Dribble**: Success reduces DRI to 0 for next resolution.
  - **Effect on Pass**: Success sets value to 0 and retrogrades by 2 rows.
  - **Effect on Shoot**: Success reduces SHO to 0 (ball reaches GK safely).

### 6.4. Goalkeeper System (Shot Defense)

When an attacker shoots, the Goalkeeper (GK) defends. The interaction depends on
whether the attacker is in the GK's zone.

#### 1v1 Goal Duel (Attacker in 1B or 6B)

A full duel sequence occurs. **The AI GK's intent (Press or Block) is revealed
at the start of the duel**, allowing the human to counter it with Moves.
Goalkeepers use **AGG** for Press and **COM** for Block.

- **Press (The Gamble)**:
  - **Attributes**: Higher volatility range (e.g., 0-4).
  - **Success**: No goal. The GK claims the ball and enters a **1v0 state** in
    his zone (The big payout).
  - **Failure**: Goal scored. Higher Heat/morale penalty.
- **Block (The Tax)**:
  - **Attributes**: Lower volatility range (e.g., 0-1).
  - **Success**: No goal. The GK claims the ball but enters a **new 1v1 duel**
    in his zone against the same attacker (The 'tax' of staying on the line).
  - **Failure**: Goal scored. Normal penalty.

#### Reaction Save (Attacker Outside 1B or 6B)

If an attacker shoots from Row 2, 3, 4, or 5 (and passes the field-player's
block), the GK triggers a **Reaction Save**. This is a simplified resolution to
keep the match flow fast.

- **The Logic**:
  - GK uses **COM** + default volatility (if Human).
  - No distance bonuses (handled via Heat requirements).
  - **Asymmetry**:
    - **Human GK**: Resolution = `Base Stats + Volatility Roll` vs
      `Fixed AI Shot`.
    - **AI GK**: Resolution = `Fixed AI Stats` vs
      `Human Shot + Volatility Roll`.
  - **Result**:
    - **Save**: Ball is caught or parried. GK enters a **1v0 state** in his
      zone.
    - **Goal**: Shot value exceeds GK defense.

> [!NOTE]
> **Defending the Duel First**: The field-player's defensive action
> (Press/Block) always resolves **before** the shot reaches the GK. A successful
> field-block cancels the shot entirely.

### 6.5. Signature Skills

Unique to **specific players only** (not every player has one). Signature Skills
**trigger on usage of Exit Actions only**. They modify or buff the final
resolution of a specific exit action (Dribble, Pass, Shoot).

**Prototype V1.0 Skill Roster**:

- **huCF — "Clinical"** _(Shoot)_: On Shoot exit, add +3 flat bonus to the final
  SHO value used in resolution.
- **huCB — "Sweeper"** _(Block)_: On a successful Block, gain +1 Heat (instead
  of the standard 0 for a defensive action).
- **aiGK — "Wall"** _(Block)_: On Block, the AI GK's volatility range is reduced
  to 0 (fixed value). Makes the AI GK extremely consistent on block saves.

---

## 7. Movement & Rotation Scenarios due to Dribble

### Core Principles

- **Trigger**: Successful Dribble only. Failed Dribble = no movement.
- **Column Rules for Dribble Target**:
  - From **2B** → **3A** (if 3A is free) or **3C** (if 3A is occupied).
  - From **3A** → **4A**. From **3C** → **4C**. (Column is preserved.)
  - From **4A** → **5B**. From **4C** → **5B**. (Both converge to center.)
  - From **5B** → **6B**. (Goal Duel — special rules apply, see §7.4.)
- **AI Coverage**: After each human cascade, the AI team re-distributes so every
  row that has a human player also has exactly one AI player (1v1 preserved). AI
  players are not strict man-markers — they fill the open rows as a unit after
  the human chain resolves.
- **AI Dribble (Mirror Rule)**: When the AI dribbles successfully, the exact
  same rotation system applies in reverse. The AI team cascades toward Row 1
  (their attacking direction) and the human team re-distributes to maintain 1v1
  coverage at every occupied row. All column rules and cascade depths are
  identical, just mirrored along the vertical axis of the field.

**Reference kickoff state** (base for all scenarios below):

```
Row 1: huGK(1B)   | –
Row 2: huCB(2B)   | aiCF(2B)
Row 3: huRB(3C)   | aiLW(3C)
Row 4: huLW(4A)   | aiRB(4A)
Row 5: huCF(5B)   | aiCB(5B)
Row 6: –          | aiGK(6B)
```

---

### 7.1. huCB (2B) Dribbles Successfully

Full 4-player cascade. huCB advances, the chain ripples through the whole team.

- **Action**: huCB dribbles 2B → **3A** (3A is free; 3C is occupied by huRB).
  - If 3A is occupied, huCB dribbles 2B → **3C** instead.
- **Result**:
  - **huCB**: 2B → **3A** (LB role). **aiRB** moves from 4A → **3A**.
  - **huRB**: 3C → **2B** (drops back). **aiCF** stays in **2B**.
  - **huLW**: 4A → **5B**. **aiCB** stays in **5B**.
  - **huCF**: 5B → **4C** (drops back). **aiLW** moves from 3C → **4C**.
- **Post-state**:
  ```
  Row 2: huRB(2B)  | aiCF(2B)
  Row 3: huCB(3A)  | aiRB(3A)
  Row 4: huCF(4C)  | aiLW(4C)
  Row 5: huLW(5B)  | aiCB(5B)
  ```

### 7.2. huRB (3C) Dribbles Successfully

2-player cascade. Only the row-3 and row-4 players shift; rows 2 and 5 stay.

- **Action**: huRB dribbles 3C → **4C**.
- **Result**:
  - **huRB**: 3C → **4C**. **aiCB** moves from 5B → **4C**.
  - **huLW**: 4A → **3A** (drops back). **aiCF** moves from 2B → **3A**.
  - **huCB**: remains in **2B**. **aiLW** moves from 3C → **2B**.
  - **huCF**: remains in **5B**. **aiRB** moves from 4A → **5B**.
- **Post-state**:
  ```
  Row 2: huCB(2B)  | aiLW(2B)
  Row 3: huLW(3A)  | aiCF(3A)
  Row 4: huRB(4C)  | aiCB(4C)
  Row 5: huCF(5B)  | aiRB(5B)
  ```

### 7.3. huLW (4A) Dribbles Successfully

Full 4-player cascade. Produces the same post-state as §7.1.

- **Action**: huLW dribbles 4A → **5B**.
- **Result**:
  - **huLW**: 4A → **5B** (CF role). **aiCB** stays in **5B**.
  - **huCF**: 5B → **4C** (drops back). **aiLW** moves from 3C → **4C**.
  - **huCB**: 2B → **3A**. **aiRB** moves from 4A → **3A**.
  - **huRB**: 3C → **2B** (drops back). **aiCF** stays in **2B**.
- **Post-state**:
  ```
  Row 2: huRB(2B)  | aiCF(2B)
  Row 3: huCB(3A)  | aiRB(3A)
  Row 4: huCF(4C)  | aiLW(4C)
  Row 5: huLW(5B)  | aiCB(5B)
  ```

> [!NOTE]
> §7.1 and §7.3 always produce identical post-states because both trigger a full
> 4-player cascade in the same direction.

### 7.4. huCF (5B) Dribbles Successfully → Goal Duel

No cascade. All other players hold their positions. Row 5 is left vacant.

- **Action**: huCF dribbles 5B → **6B** (enters 1v1 Goal Duel vs aiGK).
- **Result**:
  - **huCF**: 5B → **6B**. **aiCB** stays in **5B** (no human to mark).
  - **huLW**: stays in **4A**. **aiRB** stays in **4A**.
  - **huRB**: stays in **3C**. **aiLW** stays in **3C**.
  - **huCB**: stays in **2B**. **aiCF** stays in **2B**.
- **Post-state** (during Goal Duel):
  ```
  Row 2: huCB(2B)  | aiCF(2B)
  Row 3: huRB(3C)  | aiLW(3C)
  Row 4: huLW(4A)  | aiRB(4A)
  Row 5: –         | aiCB(5B)
  Row 6: huCF(6B)  | aiGK(6B)
  ```
- **After 6B Resolution**: huCF returns to 5B. Row 5 vacancy is cleared.

### 7.5. 1v0 State (GK Ball Possession)

A **1v0 state** occurs when a GK wins the ball via a **Press save** or a
**Reaction Save**. Special rules apply:

- **No Defender**: No AI intent is shown. The Move carousel is **hidden**.\
  The ball-holder goes directly to Exit Actions (no Touch Unit setup phase).
- **Available Exit Actions**:
  - **Pass** (default): GK passes to 2B (the CB). Formation is static — no
    Ripple.
  - **Dribble**: GK dribbles forward.
  - **Shoot**: Requires the GK zone Heat threshold (6 Heat).

---

## 8. Match Clock & Time System

- **Duration**: 2 Halves of 12 virtual minutes (24 minutes total).
- **Progression**: The 1-minute increment happens **when an Exit Action button
  is pressed**.
- **Termination**: Match ends at 24:00. Ongoing duels resolve first if the ball
  is in flight.
- **Draws**: Accepted in V1.0 Prototype.

---

## 9. Roguelike Progression

### Campaign Acts

1. **Act I: The Grind**: Pre-season amateur league.
   - _Context_: Team is broke and needs cash for fees.
   - _Win Condition_: Reach the "Cash Threshold" to pay for league registration.
   - _Loss Condition_: The Act ends without the team having enough cash.
2. **Act II: The Crown**: Local league play.
   - _Progression_: Final ranking determines if you advance to the next stage
     (must be first).
3. **Act III: The Legend**: Nation's Cup.
   - _Atmosphere_: Professional opponents.
   - _Progression_: Knockouts. Defeat ends the run.

### Day System & Events

- **Cycle**: Morning (Activity Selection) -> Afternoon (Resolution) ->
  Transition.

---

## 10. UI & Visual Experience

### 10.1. Field Minimap

- A vertical 180×320 pitch grid matching the aspect ratio of a beach soccer
  field.
- **Ball Marker**: A dedicated white glowing marker represents the ball.
- **Markers**: Blue dots for Human team, **Orange** dots (#ff9f43) for AI team.
- **Entity Offsets**: When multiple entities (Human, AI, Ball) occupy the same
  zone, they are rendered with small spatial offsets to ensure all are visible.

### 10.2. Duel HUD (Player Cards)

- **Left Card**: Human Name, Icon, Stat sheet, and **Heat Bar** (styled as a
  high-fidelity progress bar).
- **Right Card**: AI Name, Icon, Stat sheet, and **Heat Bar**.
- **AI Intent**: Current intention (Action + Fixed Value) displayed in big,
  prominent typography.
- **The Dilemma**: The central prime UI value showing "Human Action [Range] vs
  AI Intent [Value]".
- **GK Save State**: After a save, the GK enters a "Reset Duel" state where they
  are the ball-holder in their own zone.

### 10.3. Visual Flourish

- **Move Cards**: Carousel UI at bottom-center of the screen.

---

## 11. Developer Notes & Edge Cases

- **Stat Format**: Stats stored as `Base-Max` (e.g., `11-13`).
- **Resolution Sequence**: (1) Human rolls volatility → gets final attack value.
  (2) Compare rolled value vs AI fixed intent value. (3) Apply tie-break rule.
- **Tie-Break**: Defending value `>=` Attacking value = Success for the
  Defender. (Attacker must strictly exceed Defender value to win).
- **Press at Heat 0**: Press requiring minimum 1 Heat on turn 1 (Heat=0) is
  **intentional design**. Players must use Moves or earn Heat via successful
  actions to unlock Press.
- **Formation Interception**: If a player is left without a 1v1 marker due to
  erratic movement logic, the nearest logical opponent is "snapped" into their
  zone to force a duel.

---

_End of Source of Truth_
