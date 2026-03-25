# Beachballers: Source of Truth

Beachballers is a turn-based, duel-based roguelike beach soccer video game. This
document serves as the definitive reference for its mechanics, systems, and
progression.

---

## 1. Project Overview

### Move Card Archetypes (V1.5)

- **Red (Vs Press)**: Momentum and Escape.
  - _Example_: "Full Send" (+8 DRI, -5 Fitness cost).
- **Blue (Vs Block)**: Accuracy and Setups.
  - _Example_: "Lobby Pass" (Sets ball to AIR state).
- **Gray (Defense)**: Mitigation and Stamina.
  - _Example_: "Iron Lungs" (Recovers Fitness).
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
   - **The Dilemma Display**: Before any action, the human sees their success
     range (e.g., **Pass 9-11**) directly compared to the **AI Intent** (e.g.,
     **Press 7**). This is the core strategic "puzzle".
   - **Tactical Typography**: The attribute value is rendered **Bright** (high
     contrast), while the momentum roll range is **Dimmed** (lower opacity),
     emphasizing the base outcome (e.g.,
     **9**<span style="opacity:0.4; font-size:0.8em">-11</span>).
   - **Default Display**: The UI defaults to showing the **Pass** range.
   - **Hover Context**: Hovering over Dribble or Shoot updates the display to
     show that specific action's range.
   - **Defender Advantage**: In case of a tie, the **Defending Action** always
     wins.
   - **Momentum Rolls**: Human player values include an uncertain range based on
     their current **Momentum** (e.g., if Momentum is +3, the roll is 0-3). AI
     actions are pre-rolled and visible as a fixed value.
   - **AI ASYMMETRY**: The AI uses a simplified internal system (Slay The Spire
     style). It has no Playbook, Momentum, or Touch Units; its intent is a fixed
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
  - **Requirement Logic**: All Momentum/Stat requirements are tied to the
    **Role** currently held by the player in that zone.

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
  - The Human GK (huGK) is assigned to 1B. (Poliakov)
  - The AI GK (aiGK) is assigned to 6B. (Lasagna)
  - The Human CB (huCB) is assigned to 2B. (Fritz)
  - The AI CB (aiCB) is assigned to 5B. (McLovin)
  - The Human RB (huRB) is assigned to 3C. (Suzuki)
  - The AI RB (aiRB) is assigned to 4A. (Dupont)
  - The Human LW (huLW) is assigned to 4A. (Junior)
  - The AI LW (aiLW) is assigned to 3C. (Ping)
  - The Human CF (huCF) is assigned to 5B. (Donaldinho)
  - The AI CF (aiCF) is assigned to 2B. (Pong)

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

### Attributes

Every player has five primary statistics, plus Speed:

#### Player Roles & Archetypes

- **The Mountain (GK/CB)**: High COM/AGG, 0 DRI/PAS. Immovable object.
- **The Blur (LW)**: Elite DRI/SPE, extremely low Fitness (Glass Cannon).
- **The Engine (RB)**: Extreme Fitness, balanced fatigue resistance.
- **The Specialist (CF)**: Highly dependent on Momentum (Scales with momentum).
- **DRI (Dribbling)**: Used for Dribble exit actions.
- **PAS (Passing)**: Used for Pass exit actions.
- **SHO (Shooting)**: Used for Shoot exit actions.
- **AGG (Aggression)**: Used for Press defensive actions.
- **COM (Composure)**: Used for Block defensive actions.
- **REF (Reflexes)**: Used by **Goalkeepers specifically** for **Reaction
  Saves** (Long shots).

### 5.1. Human Squad (Team Blue)

- **huGK (Poliakov)**: High DIV, high COM. Defensive anchor.
- **huCB (Fritz)**: High COM, high AGG. Lane closer.
- **huRB (Suzuki)**: High PAS, high SPE. Transition specialist.
- **huLW (Junior)**: Max DRI, high SPE. Chaos creator.
- **huCF (Donaldinho)**: Max SHO, high DRI. The X-Factor.

### 5.2. AI Squad (Team Orange)

- **aiGK (Lasagna)**: High DIV, high COM. The Italian Wall.
- **aiCB (McLovin)**: High COM, high AGG. Tenacious marker.
- **aiRB (Dupont)**: High PAS, high SPE. Dynamic pivot.
- **aiLW (Ping)**: High DRI, high SPE. Quick-step winger.
- **aiCF (Pong)**: Max SHO, high DRI. Clinical finisher.

### Speed & Touch Units

- **SPE (Speed)**: Defines the maximum **Touch Units (TU)** a player can spend
  per turn.
- **Minimum Value**: A player always has at least **3 Touch Units**, even if
  their SPE stat is lower.

### Momentum Roll System

All human actions (except Block) are non-deterministic, governed by a roll range
derived from the player's current Momentum.

- **The Roll**: `Result = Attribute + Roll(0, Momentum)`.
- **Momentum Bonus**: If Momentum is +3, the roll adds `0, 1, 2, or 3` to the
  Attribute.
- **Start**: Every match begins with all players at **Momentum 0**
  (Deterministic state).
- **Dilemma Display**: Displays the **Momentum Output Range** (e.g., `11-13`)
  using "Dimmed" typography (Attribute is bright, momentum range is dimmed).

### Momentum System (Prototype V1.0)

- **Total Range (7 Units)**: Min 0 | Max 7.
- **Visual Representation**:
  - **Momentum 0**: The bar is empty.
  - **Positive (+1 to +7)**: Bar fills to the RIGHT in Yellow/Orange.
- **Start**: Default 0 at match kickoff. Persistent during match.
- **Increases**: Successful actions (+1) and certain moves.
- **Decreases**: by certain moves (Capped at 0).
- **Requirement**: Momentum acts as a threshold for many actions (e.g., Shooting
  access).
- **GK Momentum**: The human GK accumulates Momentum exclusively through
  **saves** (+1 per save).
- **UI Representation**: Displayed as large, prominent bars with a **numeric
  value overlay** (e.g., "HEAT: +2").

### Fitness System (Prototype V1.0)

- **Bar Range**: 0 (Injured) to Max (Unique per player, e.g., 15-30).
- **Match Start**: All players start at their unique Max Fitness level.
- **High Stakes**: If any player's Fitness reaches 0, they are considered
  **Injured**. For Prototype V1.0, an injury results in **Competition Over**.
- **UI Representation**: Displayed as a secondary bar on HUD player cards.

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
- **Requirements**: Momentum Threshold (Air/Ground state ignored for Prototype
  V1.0).
- **Effects**: Buffs (Stat bonuses for duel or match), Debuffs (value
  reduction).
- **Worldclass Moves**: Must provide tradeoffs, interact with Momentum, or
  change based on context (lane/zone).

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
  - **Targeting (The Momentum Driver)**: Your **current Momentum** determines
    the target row:
    - **Momentum = 0 (The Lane Switch)**: Pass to the opposite column in the
      same row.
    - **Momentum > 0**: Pass forward `X` rows (Capped at Row 6/AI GK).
    - **Note**: Players with 0 Momentum cannot pass backward.
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
    - **Scenario B: huLB passes at Momentum 0 (3A → 3C)**:
      - **Action**: **huLB** passes from 3A to receiver in 3C.
      - **Result**:
        - **huLB**: 3A → **4A**. **aiRW** moves from 3A to 4A.
        - **huRW** (receiver): 4C → **3C** (ball holder). **aiLB** moves from 4C
          to 3C.
        - **huCB**: remains in 2B. **aiCF** remains in 2B.
        - **huCF**: remains in 5B. **aiCB** remains in 5B.
    - **Scenario C: huCF (5B) passes at Momentum 0 (The Tactical Hand-off)**:
      - **Action**: **huCF** passes from 5B to 5B (remaining in the zone).
      - **Result**:
        - **huRW** (receiver): 4C → **5B** (new CF). **aiCB** stays in 5B.
        - **huCF** (passer): 5B → **4A** (new LW). **aiRW** moves from 3A to 4A.
        - **huCB**: 2B → **3C** (new RB). **aiLB** moves from 4C to 3C.
        - **huLB**: 3A → **2B** (new CB). **aiCF** stays in 2B.
    - **Scenario D: huCB (2B) passes at Momentum 0 (The Defensive Hand-off)**:
      - **Action**: **huCB** passes from 2B to 2B (remaining in the zone).
        Wide-range Ripple.
      - **Result**:
        - **huLB** (receiver): 3A → **2B** (new CB). **aiCF** stays in 2B.
        - **huCB** (passer): 2B → **3C** (new RB). **aiLB** moves from 4C to 3C.
        - **huCF**: 5B → **4A** (new LW). **aiRW** moves from 3A to 4A.
        - **huRW**: 4C → **5B** (new CF). **aiCB** stays in 5B.
    - **Scenario E: huGK (1B) passes at Momentum 0 (The Roll-out)**:
      - **GK rules**: the GK's worst pass option is to pass to 2B. Even if his
        Momentum is below 1, he will always pass to 2B.
      - **Action**: **huGK** passes from 1B to 2B.
      - **Result**: **Static**. huGK remains in 1B. huCB remains in 2B. (Fixed
        GK role).

- **Shoot**:
  - **Momentum Requirements**: Access depends on zone:
    - GK (own) zone: 5 Momentum. | CB zone: 4 Momentum. | LB/RB zone: 3
      Momentum.
    - LW/RW zone: 2 Momentum. | CF zone: 1 Momentum. | Opponent's GK zone: 0
      Momentum.
  - **AI Mirrored Rule**: For AI players (Team Orange), row requirements are
    mirrored using `row - 1`. For example, AI Wingers in Row 4 require 3
    Momentum to shoot.
  - **Constraint**: Locked if max human value < AI intent value.

### 6.3. Exit Actions (Defending)

- **Press**:
  - **Requirement**: Always available (No Momentum lock).
  - **Resolution (The Gamble)**:
    - **Final Value**: `Attribute + Roll(0, Momentum)`.
    - **Success (Press >= Attacker Value)**: Steal ball immediately.
    - **Successful Steal Outcome**: Own Momentum = Margin (`Press - Attacker`).
      Opponent Momentum = 0.
    - **Failure Outcome**: Opponent Momentum = Margin (`Attacker - Press`). Own
      Momentum = 0.
- **Block**:
  - **Requirement**: Always available.
  - **Resolution (The Secure)**:
    - **Final Value**: `Attribute + Momentum`. (Secures max momentum bonus).
    - **Success (Block >= Attacker Value)**: Steal ball immediately.
    - **Successful Steal Outcome**: Own Momentum stays at 0. Opponent Momentum
      = 0.
    - **GK Exception**: If a **Goalkeeper** successfully blocks a shot/dribble,
      they gain **+1 Momentum** (Security Bonus) instead of 0.
    - **Failure Outcome**: Own Momentum stays at 0. Opponent Momentum stays
      at 0. (Block "contains" momentum).
- **Momentum (The Pivot)**: Winning a duel generates **Momentum = Margin**.
  Losing a duel (or turnover) resets momentum to **0** for the loser.

## 11. Momentum System (§Momentum)

The Momentum system represents tactical flow and psychological advantage. It
scales from **0 to 7**.

### 11.1 Generation

- **Successful Dribble**: Attacker gains `Margin`.
- **Successful Pass**: Receiver gains `Margin`.
- **Successful Steal (Press/Block)**: New Possessor gains `Margin`.
- **Successful Save**: Goalkeeper gains `Margin`.

### 11.2 Persistence & Reset

- **Persistence**: Momentum remains through successful chains (Pass transfers it
  to the receiver).
- **Reset to 0**: Loser of any duel resets to 0.
- **Goal Scored**: Full squad reset to 0 after a goal.
- **Capping**: Strictly capped at 7.

### 11.3 Effects

- **Attacker**: Rolls `1d[0, Momentum]` as a flat bonus.
- **Defender**: Uses full `Momentum` as a flat bonus (Secure Max).

### 6.4. Goalkeeper System (Shot Defense)

When an attacker shoots, it's a two-stage resolution:

1. **Stage 1**: The defender in the zone (CB/LB/RB) attempts a **Block** or
   **Press**.
2. **Stage 2**: If the shot bypasses Stage 1, the **Goalkeeper (GK)** defends.

- **Primary Defense (Diving)**: The GK uses their **DIV** (Diving) attribute.
- **Secondary Defense (Reflexes)**: A miracle "last-ditch" save mechanic.

#### 6.4.1. The Reflex Save & Resolution Flow (§Reflex)

Shooting is a sequential multi-stage event designed for tactical clarity:

1. **Stage 1: Field Challenge**: The ball must bypass the zone's defender
   (Block/Press).
   - **1v0 Rule**: If a zone is uncontested, the shot automatically passes
     Stage 1 ("UNCONTESTED SHOT!") but **must** still resolve Stage 2 against the
     opponent's Goalkeeper.
2. **Transition**: A "Dramatic Pause" (1.5s) occurs if the shot is successful.
3. **Stage 2: Goal Challenge**: The ball reaches the GK's Diving (DIV) zone.

- **Dramatic Labels**:
  - **Attacker**: "POWER STRIKE!"
  - **Goalkeeper**: "GK DIVE!"
  - **Success State**: "DEFENDER BYPASSED!" or "GOAL SCORED!"
  - **Failure State**: "STRIKE BLOCKED!" or "SHOT SAVED!"

- **Reflex Check**: If `Shot > DIV`, a miracle check triggers automatically
  based on the GK's **Reflexes (REF)**.
- **Visual States**:
  - **REFLEX ATTEMPT**: HUD flashes the probability percentage
    (`1 / margin + 1`).
  - **REFLEX SAVE**: Success! GK matches shot value (visually updating to match
    `rolledValue`), goal is prevented.
  - **REFLEX FAILED**: Failure! Shot is too powerful, goal is confirmed.

- **Probabilities**:
  - Margin 1: 50% chance.
  - Margin 2: 33% chance.
  - Margin 3: 25% chance.
  - Margin 4: 20% chance.

### 6.5. Attributes Overview

- **DRI**: Dribbling / Close Control.
- **PAS**: Passing / Vision.
- **SHO**: Power / Finishing.
- **AGG**: Pressing / Physicality.
- **COM**: Blocking / Positioning.
- **DIV**: Goalkeeper Diving / Area Coverage. **Primary** attribute for standard
  saves.
- **REF**: Goalkeeper Reflexes / Reaction Speed. **Secondary** attribute used
  strictly for **Miracle Reflex Saves** calculation.
- **SPE**: Movement Speed / Recovery.

#### 6.4.2. Uncontested Distribution (1v0 Phase)

When a Goalkeeper successfully saves the ball (flipping possession), they enter
an **uncontested 1v0 state**. 

**Recovery Drop Rule (§10.2)**: 
To ensure the Goalkeeper has space to distribute, any attacker who loses
possession in a Goal Zone (1B or 6B) must immediately retreat to the secondary
row (Row 2 for AI, Row 5 for Human). 
- **Effect**: The GK always starts their rollout in an uncontested 1v0 state.

- **UX**: The HUD hides the opposing "Intent" side and the "VS" divider.
- **Label**: Displays **"UNCONTESTED DISTRIBUTION"**.
- **Actions**: The GK can choose any exit action (Pass/Shoot/Dribble) which will
  resolve automatically as a success (Stage 0).
- **Momentum**: Graciously grants a flat **+1 Momentum** to the receiver (on
  pass) or attacker (on dribble).

### 6.5. Attributes Overview

- **The Logic**:
  - GK uses **REF** + Momentum Roll (if Human).
  - **Asymmetry**:
    - **Human GK**: Resolution = `REF + Roll(0, Momentum)` vs
      `Fixed AI Shot/Muffled Shot`.
    - **AI GK**: Resolution = `Fixed AI REF + Roll(0, AI_Momentum)` (Fixed) vs
      `Human Shot + Roll(0, Momentum)`.
  - **Result**:
    - **Save**: Ball is caught or parried. GK enters a **1v0 state** in his
      zone.
    - **Outcome**: Gain `Margin (GK - Shot)` as Momentum.
    - **Goal**: Shot value exceeds GK defense. GK Momentum resets to 0.

- **Press (The Tackle/Gamble)**:
  - **Resolution**: `Attributes + Roll(0, Momentum)` vs
    `Attributes + Roll(0, Momentum)`.
  - **Success (Win)**: **Clean Interception**. Ball is stolen immediately. No
    shot reaches the GK.
  - **Failure (Loss)**: **Full Power Shot**. The defender is bypassed. The shot
    reaches the GK at its **Full Rolled Value**.
  - **Momentum**: Attacker gains the `Margin (Shot - Press)` as Momentum for the
    shot against the GK.
- **Block (The Screen/Secure)**:
  - **Resolution**: `Attributes + Momentum` (Fixed).
  - **Success (Win)**: **Blocked Shot**. Shot is stopped cleanly. No shot
    reaches the GK.
  - **Failure (Loss)**: **Muffled Shot (Partial Block)**. The defender didn't
    stop the shot, but they "absorbed" its power.
  - **Calculation**: `Remaining Shot Power = Attacker Value - Defender Value`.
    This power is what reaches the GK.
  - **Momentum**: No margin-based momentum is generated.

### 6.5. Signature Skills

Unique to **specific players only** (not every player has one). Signature Skills
**trigger on usage of Exit Actions only**. They modify or buff the final
resolution of a specific exit action (Dribble, Pass, Shoot).

**Prototype V1.0 Skill Roster**:

- **huCF (Donaldinho) — "Clinical"** _(Shoot)_: On Shoot exit, add +3 flat bonus
  to the final SHO value used in resolution.
- **huCB (Fritz) — "Sweeper"** _(Block)_: On a successful Block, gain +1
  Momentum (instead of the standard 0 for a defensive action).
- **aiGK (Lasagna) — "Wall"** _(Block)_: On Block, the AI GK's fixed COM value
  is always treated at its maximum possible pre-rolled value.

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
  - **Shoot**: Requires the GK zone Momentum threshold (6 Momentum).

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

- **Left Card**: Human Name, Icon, Stat sheet, and **Momentum Bar** (styled as a
  high-fidelity progress bar).
- **Right Card**: AI Name, Icon, Stat sheet, and **Momentum Bar**.
- **AI Intent**: Current intention (Action + Fixed Value) displayed in big,
  prominent typography.
- **The Dilemma**: The central prime UI value showing "Human Action [Range] vs
  AI Intent [Value]".
- **Goalkeeper Preview (§10.4)**: Defending team shows a dimmed secondary card
  of their GK to signal the two-stage shot threat.
- **GK Save State**: After a save, the GK enters a "Reset Duel" state where they
  are the ball-holder in their own zone.

### 10.4. Goalkeeper Preview

To emphasize the multi-stage nature of goal resolutions, the HUD displays a
"Shadow" card of the defending team's Goalkeeper.

- **Placement**: Sits adjacent to the active defender on the defensive side of
  the arena.
- **Visuals**: Dimmed (45% opacity), scaled down (0.8x), and slightly
  grayscaled.
- **Content**: Displays the GK's **DIV** attribute.
- **Behavior**: Auto-hides if the Goalkeeper is already the active participant
  in the duel.

### 10.3. Visual Flourish

- **Move Cards**: Carousel UI at bottom-center of the screen.

---

## 11. Developer Notes & Edge Cases

- **Stat Format**: Stats stored as `Attribute-Max` (e.g., `11-13`).
- **Resolution Sequence**: (1) Human roll range calculated based on Momentum.
  (2) Outcome is rolled and compared vs AI pre-rolled fixed value. (3) Apply
  resolution (Success/Failure/Momentum Transfer).
- **Momentum System (The Universal Multiplier)**: Scaled 0-7. See §11 for
  persistence rules.
- **AI AI (The Transparent Opponent)**:
  - AI Intent values are **pre-rolled**. The human sees the final
    `Attribute + Roll(0, AI_Momentum)` value before acting.
- **Reflex Sync**: Ensure `_calculateReflex` uses `Math.ceil(shot)` and
  `Math.floor(DIV)` to maintain integer margins.
- **Recovery Drop Verification**: Possession flips in 1B/6B force the former
  attacker to Row 2/5 to prevent "GK-Stall" duels.
- **Mandatory Challenge**: All SHOOT actions force Stage 2 (Goal Challenge) even
  if Stage 1 (Field) is uncontested (1v0).

---

_End of Source of Truth_
