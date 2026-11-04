# Prompt — 3D equipment `steam-turbine` → `src/features/spare-3d/equipment/steam-turbine/index.tsx`

Generate the parts first (their PROMPT.md files); this assembly imports them. Copy everything below the line into the AI.

---
Write ONE React Three Fiber TSX file: an X-ray-capable, explodable 3D assembly of a **Steam turbine driver (KT)** in a naphtha cracker.
Approximate real size L×H×W = 5×3×3 m; model it so the longest side = 4 units, base at y = 0.

**Outer shell / casing:** Split casing with steam chest on top; governor valve rack; exhaust hood.

**Part slots (internal parts shown in x-ray; ids are used by fault data):**
| slot id | part component | name | placement |
|---|---|---|---|
| `rotor-blades` | `blade` → `Blade` | Rotor blade rows | 3-5 discs on shaft |
| `journal-de` | `bearing-journal` → `BearingJournal` | Journal bearing | each end |
| `thrust` | `bearing-thrust-pad` → `BearingThrustPad` | Thrust bearing | front pedestal |
| `gov-valve` | `valve-governor` → `ValveGovernor` | Governor valve | steam chest |
| `gland-seal` | `seal-labyrinth` → `SealLabyrinth` | Gland labyrinth seals | shaft ends |
| `trip-spring` | `spring` → `Spring` | Trip valve spring | trip valve |
| `solenoid` | `solenoid-valve` → `SolenoidValve` | Trip solenoid | on trip block |
| `speed-tx` | `transmitter` → `Transmitter` | Speed/pressure transmitter | front |
| `casing-gasket` | `gasket` → `Gasket` | Casing joint gasket | split line |

Imports to use (already exist, each accepts `PartProps` = { color?, highlight?, detail? } and is normalised to 1 unit, axis +X):
```ts
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";
import BearingJournal from "../../parts/bearing-journal";
import BearingThrustPad from "../../parts/bearing-thrust-pad";
import Blade from "../../parts/blade";
import Gasket from "../../parts/gasket";
import SealLabyrinth from "../../parts/seal-labyrinth";
import SolenoidValve from "../../parts/solenoid-valve";
import Spring from "../../parts/spring";
import Transmitter from "../../parts/transmitter";
import ValveGovernor from "../../parts/valve-governor";
```
Rules:
1. `export const SLOTS: SlotDef[]` — one entry per slot above, EXACT shape `{ id, part, name, position, rotation?, scale? }`: key is `part` (the folder id, e.g. "blade"), `scale` is ONE number (not an array), `position` = where the part (or the centre of a repeated group) sits in assembly coordinates. Repeated parts (blades, burners, trays, bolts) = one slot rendered several times.
2. `export default function SteamTurbine({ xray = false, explode = 0, faults = {}, onShellClick, onPartClick, detail = "high" }: EquipmentProps)`.
3. Every casing/shell mesh group is wrapped in `<XRayShell active={xray} explode={[dx, dy, dz]} onClick={onShellClick}>` (offset used while x-ray is on, max 1.5 units). The base skid is NOT wrapped (it stays solid).
4. Every slot is wrapped in `<FaultPulse>`. **FaultPulse already moves its children to `slot.position`**, so inside it place parts in LOCAL coordinates: `[0, 0, 0]` plus only the explode offset (repeated copies: their offset from the slot centre). NEVER repeat `slot.position` or the shaft height inside FaultPulse. Pattern:
```tsx
const s = SLOTS[0]; // "rotor-blades"
<FaultPulse active={Boolean(faults[s.id])} position={s.position} radius={0.4}
  label={faults[s.id] && { title: s.name, value: faults[s.id].value }} showLabel={xray}
  onClick={xray ? () => onPartClick?.(s.id) : undefined}>
  <group position={[-explode * 0.3, 0, 0]} rotation={s.rotation} scale={s.scale}>
    <Blade highlight={Boolean(faults[s.id])} detail={detail} />
  </group>
</FaultPulse>
```
5. Parts are 1 unit in size → set `scale` so each part has its real size relative to the casing. When `explode > 0`, internal parts move apart along their main axis (offset × `explode`), so each part is visible separately.
6. `detail === "low"` → render only shells + 1–2 key parts (plant layout view).
7. At most ONE rotating group (shaft + impellers/blades), ONE `useRef` per group (never the same ref on two groups), spin slowly with `useFrame` only when `detail === "high"`.
8. No `<Canvas>`, no lights, no state other than refs. Output only the full file.
