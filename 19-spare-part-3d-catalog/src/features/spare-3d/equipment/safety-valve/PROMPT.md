# Prompt — 3D equipment `safety-valve` → `src/features/spare-3d/equipment/safety-valve/index.tsx`

Generate the parts first (their PROMPT.md files); this assembly imports them. Copy everything below the line into the AI.

---
Write ONE React Three Fiber TSX file: an X-ray-capable, explodable 3D assembly of a **Pressure safety valve (PRV)** in a naphtha cracker.
Approximate real size L×H×W = 0.5×1.2×0.5 m; model it so the longest side = 4 units, base at y = 0.

**Outer shell / casing:** Angle body + bonnet + cap; bonnet fades to show spring.

**Part slots (internal parts shown in x-ray; ids are used by fault data):**
| slot id | part component | name | placement |
|---|---|---|---|
| `spring` | `spring` → `Spring` | Set-pressure spring | bonnet |
| `disc` | `disc` → `Disc` | Disc | on nozzle |
| `nozzle` | `nozzle` → `Nozzle` | Nozzle | inlet |
| `gasket` | `gasket` → `Gasket` | Inlet gasket | inlet flange |
| `studbolts` | `studbolt` → `Studbolt` | Studbolts | flanges |

Imports to use (already exist, each accepts `PartProps` = { color?, highlight?, detail? } and is normalised to 1 unit, axis +X):
```ts
import type { EquipmentProps, SlotDef } from "../../contract";
import { XRayShell, FaultPulse } from "../../core";
import Disc from "../../parts/disc";
import Gasket from "../../parts/gasket";
import Nozzle from "../../parts/nozzle";
import Spring from "../../parts/spring";
import Studbolt from "../../parts/studbolt";
```
Rules:
1. `export const SLOTS: SlotDef[]` — one entry per slot above, EXACT shape `{ id, part, name, position, rotation?, scale? }`: key is `part` (the folder id, e.g. "spring"), `scale` is ONE number (not an array), `position` = where the part (or the centre of a repeated group) sits in assembly coordinates. Repeated parts (blades, burners, trays, bolts) = one slot rendered several times.
2. `export default function SafetyValve({ xray = false, explode = 0, faults = {}, onShellClick, onPartClick, detail = "high" }: EquipmentProps)`.
3. Every casing/shell mesh group is wrapped in `<XRayShell active={xray} explode={[dx, dy, dz]} onClick={onShellClick}>` (offset used while x-ray is on, max 1.5 units). The base skid is NOT wrapped (it stays solid).
4. Every slot is wrapped in `<FaultPulse>`. **FaultPulse already moves its children to `slot.position`**, so inside it place parts in LOCAL coordinates: `[0, 0, 0]` plus only the explode offset (repeated copies: their offset from the slot centre). NEVER repeat `slot.position` or the shaft height inside FaultPulse. Pattern:
```tsx
const s = SLOTS[0]; // "spring"
<FaultPulse active={Boolean(faults[s.id])} position={s.position} radius={0.4}
  label={faults[s.id] && { title: s.name, value: faults[s.id].value }} showLabel={xray}
  onClick={xray ? () => onPartClick?.(s.id) : undefined}>
  <group position={[-explode * 0.3, 0, 0]} rotation={s.rotation} scale={s.scale}>
    <Spring highlight={Boolean(faults[s.id])} detail={detail} />
  </group>
</FaultPulse>
```
5. Parts are 1 unit in size → set `scale` so each part has its real size relative to the casing. When `explode > 0`, internal parts move apart along their main axis (offset × `explode`), so each part is visible separately.
6. `detail === "low"` → render only shells + 1–2 key parts (plant layout view).
7. At most ONE rotating group (shaft + impellers/blades), ONE `useRef` per group (never the same ref on two groups), spin slowly with `useFrame` only when `detail === "high"`.
8. No `<Canvas>`, no lights, no state other than refs. Output only the full file.
