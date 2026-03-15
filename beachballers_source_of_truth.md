# Beachballers — Game Design Overview

## Core Concept

- **Title:** Beachballers
- **Theme:** Beach soccer
- **Genre:** Roguelike
- **Gameplay Style:** Turn-based

The game focuses on **1v1 duels between players** during a beach soccer match.
Tactical choices during duels determine ball progression, passes, shots, and
possession changes.

---

# Match Structure

## Play states

During play, the match exclusively goes duel to transition to duel to
transition, etc. Technically, there are 2 play states: duel and transition.

- Duel is a **1v1 duel moment**. The player makes tactical decisions controlling
  the involved character.
- Transition is the automatic moment in which the consequences of duel
  resolution are applied (ball position updates, possession changes).

---

## Match Loop & Time System

### Duration

- **Total:** 2 Halves of **12 virtual minutes** each (24 minutes total).
- **Turn Duration:** Each turn in a duel represents **1 virtual minute**.
  - During a turn, the player can perform multiples moves. The turn ends when
    player chooses an exit action or taps on the "Hold" (end turn) button.
- **Game Clock:** Progression occurs during **Flow (Transition)** after each
  duel resolution.

### Match Termination

- **Match Termination:**
  - A match ends when the virtual timer reaches **24:00**.
  - If a duel is ongoing, the match ends **immediately after the current turn's
    resolution**. No extra time/actions allowed unless the ball is already in
    flight (Pass/Shot resolution).
- **Tournament Standings:**
  - **Qualifiers (Act I):** Any loss ends the run.
  - **Group Stage (Act II):** Progression depends on total points and ranking.
  - **Knockouts (Act III):** Defeat ends the run.
- **Draws:**
  - **V1.0 Prototype:** Draws are accepted as a final result.
  - **Tournament Standard:** Extra Time -> Penalties (Full Game Logic).

---

## Kick-off System

### Initial Kick-off

- Determined **randomly** at match start.
- **Starting Position:** Ball holder starts in their own **Midfield Zone**
  (`x=2` for Player, `x=3` for AI).
- The team that did not kick off the first half will kick off the **second
  half**.

### Post-Goal Kick-off

- After a goal, the team that was **scored upon** kicks off.
- **Time Cost:** Goal celebrations/reset add an automatic **1 minute** to the
  clock.

---

---

## Possession Logic

A team is always in one of two states:

### In Possession

- Player controls the **ball holder**.

### Out of Possession

- Player controls the **defender** engaged in the duel.
- **Visible Intent (Slay the Spire Style):** When the AI is the Ball Holder and
  enters a "Break", the human player **always sees the AI's planned Exit
  Action** (Dribble, Pass, or Shoot) or if it intends to **Hold**. The player
  then uses moves to counter this specific intent.

---

# Field Structure

## Zones

The field is structured **vertically** as a 1-2-2-1 grid (6 zones total):

- **Player Goalkeeper Zone:** (y = 0) Bottom of the field.
- **Midfield Row 1:** (y = 1, x = 0..1) Two field zones.
- **Midfield Row 2:** (y = 2, x = 0..1) Two field zones.
- **Opponent Goalkeeper Zone:** (y = 3) Top of the field.

In each of the 4 central midfield zones:

- There is always **one 1v1 duel between opposing players**.
- These zones are divided into two horizontal lanes (x=0 and x=1).

---

## Lanes & Positioning

### Coordinates

- **Vertical (y):** `0` (Player GK) -> `3` (AI GK)
- **Horizontal (x):** `0` (Left) / `1` (Right)
  - _Note: GK zones (y=0, y=3) occupy the full width but are technically handled
    as x=0 logic-wise._

### Initial Duel Positioning

When a duel begins in a field zone (y=1 or y=2):

- **Defender:** always starts in the **Inside Lane** (x=0 if near center, but
  simplified to x=0 for V1.0 logic).
- **Attacker:** randomly starts in either lane (**x=0** or **x=1**).

**Coordinate System Summary:**

- **Player GK:** `y = 0`
- **Field Zones:** `y = 1, 2` (x = 0, 1)
- **Opponent GK:** `y = 3`

---

# Duel System

## Core Principle

The game is fundamentally built around **1v1 duels**, each occurring inside a
field zone. Players perform **actions during turns** until someone chooses an
**exit action**, which resolves the duel.

---

# Action Categories

Actions are divided into **Tactical Moves** (Playbook), **Exit Actions**
(Resolution), and **System Actions** (UI).

## 1. Exit Actions

Actions that **end the duel immediately** and trigger outcome resolution (Stat
Comparison).

### If Attacking (Ball Holder)

- **Dribble**
- **Pass**
- **Shoot**

### Goalkeeper Restrictions

- **Goalkeepers (GK) cannot Dribble.** They are restricted to **Pass**,
  **Shoot**, and **Hold** actions.
- **Save State:** After a save, the GK enters a "Reset Duel" (see Duel
  Outcomes).

---

## 2. System Actions

These are technical buttons in the UI wheel that interact with the turn
structure but **do not resolve the duel**.

- **Hold (End Turn):** Ends the current turn. This button is used when the
  player has no more TUs or wishes to stop acting without resolving the duel via
  an Exit Action.
- **Properties:**
  - Costs **30 virtual seconds**.
  - Does **not** trigger stat comparison.
  - **Hold Limit:** If both players "Hold" for **2 consecutive turns**, the next
    turn **disables the Hold button** for both; an Exit Action must be chosen.
  - Duel continues to next turn/resolves opponent's intent.

---

## 2. Move Actions

Moves are **non-exiting duel actions**.

- They allow tactical setup before resolving the duel.
- They cost **Touch Units**.

### Touch Units

- Each player has **3 touch units per turn by default**.
- **Speed Stat Interaction:** A player's **Speed (SPE)** stat equals their **max
  Touch Units** per turn. (e.g., SPE 4 = 4 TUs).

### Move Costs

Moves can cost 0, 1, 2, or 3 touches.

---

# Duel Context Variables

## Ball State

The ball can be **Ground** or **Air**.

- **Ground (Default):** Standard state.
- **Air:**
  - **Interaction:** Bypasses "Ground-based" defensive modifiers.
  - **Penalty:** Adds **+20% Volatility** to Shots and Passes.
  - Specific moves (like Volleys or Headers) require the ball to be in the Air.

---

## Heat Bar (Momentum)

Each player has a **Heat bar** (Scale: 0–10).

- **Default State:** Starts at **3** (Representing freshness).
- **Generation:** +1 per Move Action, +2 per successful Exit Action.
- **Post-Goal Reset:** After a goal, the scoring player's Heat resets to **3**
  (representing the physical toll of the sprint/celebration) to prevent
  snowballing.
- **Decay/Penalty (Fatigue):**
  - -1 if an Exit Action fails.
  - -2 if a Duel is lost.
- **Low Heat Penalty:** If Heat is **0**, all Primary Stats (DRI, PAS, SHO, TAC)
  are reduced by **-2**.
- **Usage:** Some moves require a minimum Heat (e.g., 5) to be usable.

---

# Playbook System

The **Playbook** represents the team's tactical move pool, shared by the entire
team.

### Playbook Structure

- **Preset:** Playbooks are preset at the start of a run with basic moves.
- **Grids:**
  - **Attacking Playbook:** Divided into **3 grids** (Tackle Counters, Press
    Counters, Block Counters).
  - **Defending Playbook:** Contains **one grid** of defensive moves.
- **Slots:** Each grid initially has **3 slots** for moves.
- **Colors & Type:**
  - **Color-based Moves:** Red (Tackle), Orange (Press), Blue (Block). Can only
    be placed in their matching grid.
  - **Colorless Moves:** Versatile moves that the player can decide to place in
    **any** of the 3 attacking grids.
  - **Passive Defending Moves:** All tagged **“D”** for the defending grid.

### Attacking Playbook Grids

1. **Tackle Counters** (Red + Colorless)
2. **Press Counters** (Orange + Colorless)
3. **Block Counters** (Blue + Colorless)

---

# Move catalog (V1.0 Examples)

### Attacking (Tackle Counter - Red)

- **Quick Step:** +2 DRI for current turn. (Cost: 1 TU)
- **Shield:** +3 CON vs Tackle. (Cost: 1 TU)
- **Nutmeg:** If DRI > 12: Success bypasses defender and enters next zone.
  (Cost: 2 TU)

### Attacking (Press Counter - Orange)

- **One-Two Setup:** +4 PAS for next exit action. (Cost: 1 TU)
- **Lateral Glide:** Switch Lane. (Cost: 0 TU, requires **5 Heat**)
- **Scoop:** Change ball state to **Air**. (Cost: 1 TU)

### Attacking (Block Counter - Blue)

- **Fake Shot:** +5 DRI for next move. (Cost: 1 TU)
- **Drive:** +3 SHO for next exit action. (Cost: 1 TU)

### Defending (D)

- **Tighten:** -2 to Attacker DRI for 1 turn.
- **Stand Ground:** +2 to Reaction.
- **Aggressive Lunge:** Triggers immediate Tackle with bonus volatility.

---

# Move Draw & Reactionary Filter (Asymmetry)

The move pool available to the human player is filtered based on the **AI's
Intent**.

### When Human is Attacking

The AI Defender has a passive **Defensive Intent** that determines the "Draw
Filter" for moves:

- **Tackle intent:** AI will try to Tackle at the end of the round. (Red
  counters).
- **Press intent:** AI stays close, forcing moves. Resolves as **Hold**. (Orange
  counters).
- **Block intent:** AI protects space. Resolves as **Hold**. (Blue counters).
- **AI Simplified Logic (STS Style):** The AI does **not** have its own
  Playbook, Heat, or Touch Units. Its intent is a fixed outcome that resolves at
  the end of the turn if not countered.
- **AI Flat Modifier:** Intent applies a flat stat modifier to the resolution.

### When AI is Attacking

The human Defender sees the AI's **Planned Exit Action**:

- **Dribble / Pass / Shoot intent:** AI will resolve this action if the human
  ends the turn (Holds).
- **Hold intent:** AI stays stationary, duel continues. **Developer Note:** The
  human can still Tackle an AI that chooses "Hold".

---
### AI Defender Intent (When Human is Attacker)
| Intent | Weight | Logic                                 |
| ------ | ------ | ------------------------------------- |
| Tackle | 40%    | Aggressively tries to win the ball.   |
| Press  | 40%    | Standard, forces moves usage.         |
| Block  | 20%    | Passive, protects goal/passing lane. |
### AI Behavior (The "Brain")
- **Intelligent Intent:**
  - **Shoot:** Weight is 0% if the ball is in midfield (y < 2). AI will only shoot from y=2 or y=3.
  - **Risk Awareness:** AI is more likely to **Hold** if the Attacker's primary stat is significantly lower than the human's REA.
  - **Progression:** AI is more likely to **Pass** if it is in its own half (y=1) to clear the ball.
---

# Duel Loop & Turn Order

1. **Duel Start:** Human is always the first actor.
2. **AI Preview:** AI’s intent is displayed above the AI character.
3. **Human Turn:** Human uses Moves or an Exit Action.
4. **Resolution/Next Turn:**
   - **If Human uses Exit Action:** Duel resolves and ends.
   - **If Human uses "Hold":**
     - 1 minute passes.
     - The AI's intent executes/resolves (if it was an Exit Action) **OR** a new
       turn starts if both held.
     - **Recovery:** Any "Inactive" defender from the previous turn recovers
       their stats at this moment (start of the new 30s turn).

---

# Exit Action Resolution

Resolutions are multi-staged and subtractive.

## 1. Interaction Phase

- **Action Selection:** When Attacker chooses **Pass** or **Shot**.
- **Resistance:** The active Defender's **Reaction (REA)** stat is subtracted
  from the Attacker's base stat.
  - `RemainingVal = AttackerStat - DefenderREA`
- **Failure Condition:** If `RemainingVal <= 0`, the action is **blocked
  immediately**. Possession swap occurs.

## 2. Distance Phase (For Shots)

- **Drop-off:** `RemainingVal = RemainingVal - DistancePenalty`.
- **Distance Penalty (Passes & Shots):**
  - **Shots:** -2 for each **Row (y)** away from the opponent's GK Zone.
  - **Passes:** -1 for each **Row (y)** the ball traverses. If
    `Stat - Distance - REA <= 0`, the pass is intercepted mid-flight by a
    defender in an intermediate zone.

## 3. Final Comparison (vs Goalkeeper)

- **The Roll:**
  `FinalVal = RemainingVal * (1 + random(-Volatility, +Volatility) / 100)`.
- **GK Defense:**
  `GKVal = GK.REA * (1 + random(-Volatility, +Volatility) / 100)`.
- **Result:** If `FinalVal > GKVal` → Success (Goal).

## Stat Matchups Summary

| Action  | Primary Interaction | Secondary (Goalie) |
| ------- | ------------------- | ------------------ |
| Dribble | DRI vs REA          | N/A                |
| Pass    | PAS vs REA          | N/A                |
| Shoot   | SHO vs REA          | vs GK.REA          |
| Tackle  | TAC vs CON          | N/A                |

---

# Duel Outcomes

- **Successful Dribble:** Move to **next offensive zone** (+1 y for Player, -1 y
  for AI).
  - **Auto-Rotation:** To maintain field balance, a teammate from the target
    zone moves to the vacated zone to "refill" it.
  - **Exception:** If entering a **Goalkeeper Zone**, no rotation occurs. The
    vacated midfield square remains empty.
- **Successful Pass:**
  - **Selection UI:** Ultra-basic (e.g., list of teammate buttons).
  - **Targeting:** Player selects a **specific teammate** in another zone
    (including GK).
  - **Landing:** Receiver's lane (Inside vs Outside) is determined **Randomly**
    on arrival.
  - **Defender:** The new defender always starts in the **Inside Lane**.
- **Successful Shot:** (1) Bypasses active defender → (2) Resolves vs
  Goalkeeper.
  - _Distance Penalty applies if outside opponent GK zone._
- **Goalkeeper Save (Unsuccessful Shot):**
  - **GK Possession:** The Goalkeeper immediately gains possession.
  - **Reset Duel:** Triggers a special duel in the GK zone with **no active
    defender**.
  - **Opponent State:** If the attacker was physically in the GK zone during the
    shot, they become **"Inactive"** (TAC/REA=0) for the GK's first turn.
  - **GK Options:** The GK can only choose **Pass**, **Shoot**, or **Hold** (No
    Dribble).
  - **GK Shot Clock:** If the GK chooses **Hold** for **3 consecutive turns**,
    the "Free" state expires. The opponent's Striker (highest SHO) immediately
    engages in a duel with the GK. The GK must then choose a move or exit
    action.
- **Unsuccessful Pass/Dribble:**
  - **Interception:** If a Pass fails (`RemainingVal <= 0`), the ball is caught
    by an **intercepting defender**.
  - **Interceptor Selection:** The ball is caught by the teammate of the engaged
    defender located in the Row (y) where the `RemainingVal` reached zero or
    below.
  - **Result:** Possession swaps. A new duel starts immediately with the
    interceptor as the new Attacker.
- **Successful Tackle:** Tackler gains possession + New duel in next offensive
  zone.
- **Unsuccessful Tackle:** Tackler becomes **"Inactive"** for the remainder of
  the turn.
  - **Effect:** The defender's Primary Stats (TAC, REA) are reduced by **-50%**
    for the next exit action or move resolution in that duel.

---

# Team Rotation & Movement

To ensure the team maintains a balanced formation (1-2-2-1), teammates
automatically rotate to fill vacancies during ball progression.

### 1. Vertical Progression (Dribble)

- When the Ball Holder progresses from one midfield row to the next (e.g., Row 1
  -> Row 2):
  - **Simple Swap:** If a teammate is already in the target zone, they
    automatically move to the zone the Ball Holder just vacated.
  - **Result:** Balanced 1-2-2-1 formation is maintained.

### 2. Goal Attack Exception

- When a player progresses from the final midfield row into the **Goalkeeper
  Zone**:
  - No teammate rotates forward or backward.
  - The midfield square previously occupied by the Ball Holder remains
    **empty**.
  - This represents a "Breakaway" where the teammates hold their defensive
    positions.

### 3. Positional Reset

- After a Goal or a Half-time reset:
  - All players return to their default zones based on the **Kick-off System**.

---

- **Team:** 5 players, no substitutes.
- **Recruitment:** Beach Bar or Special Events. A new recruit **replaces** an
  existing player.
- **Stats:** DRI, PAS, SHO, TAC, REA, CON (GKs have the same stats).

## Signature Moves

- Unique techniques tied to specific players.
- Apply **only to exit actions**.
- Innate or to unlock during progression.

---

# Roguelike Progression

## Campaign Acts

1. **Qualifiers**
2. **Group Stage**
3. **Knockouts**

## Day System

- **Cycle:** Morning (Select Activity) → Afternoon (Resolve) → Transition (Next
  Day).
- **Events:** Match, Training (+1 random stat), Beach Bar (Recruit), Special
  Event.

## Playbook Expansion & Customization

- **Move Acquisition:** New moves (colored or colorless) can be acquired as
  rewards or purchased.
- **Manual Assignment:** When a player acquires a move, they decide which grid
  (and slot) to place it in. Colorless moves offer maximum flexibility here.
- **Slot Expansion:** Unlock additional slots in any of the 4 grids to increase
  tactical options per turn.
- **Upgrades:** Transform or upgrade existing moves in the playbook.

---

# Experience & Leveling Up

Players grow during the campaign based on their match performance.

### 1. Earning Experience (XP)

- **Goal Scored:** +20 XP (Scorer).
- **Successful Assist:** +15 XP (Passer).
- **Successful Tackle/Save:** +10 XP.
- **Successful Action (Dribble/Pass):** +2 XP.
- **Match Completion:**
  - **Win:** +50 XP to all participating players.
  - **Draw/Loss:** +20 XP to all participating players.

### 2. Leveling Up

- **Threshold:** Level 1 -> 2 (100 XP), Level 2 -> 3 (250 XP), etc.
- **Rewards:** Upon leveling up, the player gains **+1 to a random primary
  stat**.
- **Level Cap:** V1.0 Level cap is **5**.

---

# UI Design & Feedback

## 1. Field Minimap

- A vertical 1-2-2-1 grid visualization showing the location of the current
  duel.
- **Structure:**
  - Top:AI Goal area.
  - Middle: 2x2 grid for midfield duels.
  - Bottom: Player Goal area.
- **Indicator:** Highlight the active zone (x, y).

## 2. Duel HUD (Player Cards)

- **Left Card (Player):** Name, Icon, Stat sheet (DRI, PAS, SHO, TAC, REA, CON),
  and **Heat Bar**.
- **Right Card (Opponent):** AI Name, Icon, Stat sheet, and **Heat Bar**.
- **Visible Intent:** AI's current intention (e.g., "AI planning to SHOOT")
  displayed prominently above the opponent's card.

## 3. Action Prediction

- When hovering/selecting an action (Pass/Shot/Dribble), the UI displays:
  - **Estimated Success %**
  - **Predicted Result Value** (e.g., "14 SHO - 8 REA = 6 Total")

## 4. Visual Flourish

- **Move Cards:** Transparent squares with Icon, Title, and One-line effect.
- **Display:** Carousel UI at bottom-center of the screen.

---

# Prototype Implementation Notes (AI Developer Focus)

### 1. The Action Loop

To avoid development "struggles", follow this execution order in code:

1. **Enter Zone:** Check ball state and lane positions.
2. **Reveal Intent:** Roll and show AI intent (e.g., "AI is planning to SHOOT"
   or "AI is ready to TACKLE").
3. **Drafting:** Filter Human Playbook for moves that counter that specific AI
   intent color (Red/Orange/Blue) or action type.
4. **Player Turn:** Human uses TUs for Moves.
5. **Phase Resolution:**
   - If **Exit Action** used: Resolve stats and end duel.
   - If **Hold** used: Cost 30s, then execute AI's intent (if Exit) or start a
     new round.

### 2. State Management Strategy

- **Modifier Persistence:**
  - **Moves/Buffs:** Persist across "Hold" turns within the **same duel**.
  - **Expiration:** All buffs/debuffs are cleared when the duel ends (via Exit
    Action resolution or Possession Swap).
- **Next Action Modifiers:** Expire at the end of the round regardless of
  whether the action occurred (Rewards/Punishes the "Hold" strategy).
- **Stacking:** Buffs of the **same name do not stack** (highest value applies).

### Tactical Effects

- Always recalculate "Effective Stats" (Base + Modifiers) before a resolution.
- **V1.0 Scale:** Stats range from **1 to 20** (Base) / **30** (With Buffs).

### 3. Coordinate Handling

- Use `x-distance` for shot penalties.
- `GK Zone` special logic: If `Attacker.Foot == "Right"`, `y=1` (Outside) is the
  right side of the field.

### 4. Rendering & Animation (Assumed Constraints)

- **Duel (Break) View:** Camera zooms into a side-view 2D perspective.
- **Transition (Flow) View:** Camera pulled back to show full field top-down or
  isometric.
- **Animation States:** Simple transforms (Flip, Bounce, Slide). No complex rig
  animation required for V1.0.

### 5. Input & State Blocking

- **The "Lock":** Input is entirely disabled during Transition and during AI
  intent rolling.
- **Carousel Interaction:** Selecting a card consumes TUs immediately.

### 6. Data Persistence (The Run State)

- The entire run is stored in a single `gameState` object:

  ```json
  {
      "currentDay": 4,
      "sandDollars": 120,
      "roster": [...],
      "playbook": { "attacking": [...], "defending": [...] },
      "campaignProgress": "Act 1",
      "activeMatch": null
  }
  ```

### 7. Asset Placeholders

- Use **CSS-only graphics** or simple SVGs for player icons.
- Sound effects are triggered on: `Card Select`, `Resolution Success`,
  `Resolution Fail`, and `Goal`.

---

# Technical Data Structures (Assumptions)

### Player Object

```json
{
    "id": "gonzo_01",
    "name": "Gonzo",
    "stats": {
        "DRI": 14,
        "PAS": 10,
        "SHO": 12,
        "TAC": 8,
        "REA": 11,
        "CON": 13,
        "SPE": 3
    },
    "heat": 0,
    "lane": 0,
    "signatureMoves": ["Venom_Shot"],
    "isGK": false
}
```

### Recruitment Costs

- **Common:** 50 Sand Dollars (Avg stats 8-10)
- **Rare:** 150 Sand Dollars (Avg stats 11-13)
- **Legendary:** 500 Sand Dollars (Avg stats 14+)
