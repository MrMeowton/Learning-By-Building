# Prompt — 3D equipment `piping-line` → `src/features/spare-3d/equipment/piping-line/index.tsx`

Generate the parts first (their PROMPT.md files); this assembly imports them. Copy everything below the line into the AI.

---
Write ONE React Three Fiber TSX file: an X-ray-capable, explodable 3D assembly of a **Piping line (LINE)** in a naphtha cracker.
Approximate real size L×H×W = 6×1×1 m; model it so the longest side = 4 units, base at y = 0.

**Outer shell / casing:** Insulation jacket fades in x-ray.

**Part slots (internal parts shown in x-ray; ids are used by fault data):**
| slot id | part component | name | placement |
|---|---|---|---|
| `pipe` | `pipe` → `Pipe` | Pipe spool | run |
| `elbow` | `elbow` → `Elbow` | Elbows | bends |
| `tee` | `tee` → `Tee` | Tee | branch |
| `flange` | `flange` → `Flange` | Flanges | joints |
| `gasket` | `gasket` → `Gasket` | Gaskets | joints |
| `studbolts` | `studbolt` → `Studbolt` | Studbolts | joints |
| `block-valve` | `valve-gate` → `ValveGate` | Block gate valve | inline |
| `antirust` | `antirust` → `Antirust` | Antirust coating | external |
| `tape` | `tape` → `Tape` | Wrapping tape | external |

Imports to use (already exist, each accepts `PartProps` = { color?, highlight?, detail? } and is normalised to 1 unit, axis +X):
```ts
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";
import Antirust from "../../parts/antirust";
import Elbow from "../../parts/elbow";
import Flange from "../../parts/flange";
import Gasket from "../../parts/gasket";
import Pipe from "../../parts/pipe";
import Studbolt from "../../parts/studbolt";
import Tape from "../../parts/tape";
import Tee from "../../parts/tee";
import ValveGate from "../../parts/valve-gate";
```
Rules:
1. `export const SLOTS: SlotDef[]` — one entry per slot above, EXACT shape `{ id, part, name, position, rotation?, scale? }`: key is `part` (the folder id, e.g. "pipe"), `scale` is ONE number (not an array), `position` = where the part (or the centre of a repeated group) sits in assembly coordinates. Repeated parts (blades, burners, trays, bolts) = one slot rendered several times.
2. `export default function PipingLine({ xray = false, explode = 0, faults = {}, onShellClick, onPartClick, detail = "high" }: EquipmentProps)`.
3. Every casing/shell mesh group is wrapped in `<XRayShell active={xray} explode={[dx, dy, dz]} onClick={onShellClick}>` (offset used while x-ray is on, max 1.5 units). The base skid is NOT wrapped (it stays solid).
4. Every slot is wrapped in `<FaultPulse>`. **FaultPulse already moves its children to `slot.position`**, so inside it place parts in LOCAL coordinates: `[0, 0, 0]` plus only the explode offset (repeated copies: their offset from the slot centre). NEVER repeat `slot.position` or the shaft height inside FaultPulse. Pattern:
```tsx
const s = SLOTS[0]; // "pipe"
<FaultPulse active={Boolean(faults[s.id])} position={s.position} radius={0.4}
  label={faults[s.id] && { title: s.name, value: faults[s.id].value }} showLabel={xray}
  onClick={xray ? () => onPartClick?.(s.id) : undefined}>
  <group position={[-explode * 0.3, 0, 0]} rotation={s.rotation} scale={s.scale}>
    <Pipe highlight={Boolean(faults[s.id])} detail={detail} />
  </group>
</FaultPulse>
```
5. Parts are 1 unit in size → set `scale` so each part has its real size relative to the casing. When `explode > 0`, internal parts move apart along their main axis (offset × `explode`), so each part is visible separately.
6. `detail === "low"` → render only shells + 1–2 key parts (plant layout view).
7. At most ONE rotating group (shaft + impellers/blades), ONE `useRef` per group (never the same ref on two groups), spin slowly with `useFrame` only when `detail === "high"`.
8. No `<Canvas>`, no lights, no state other than refs. Output only the full file.
