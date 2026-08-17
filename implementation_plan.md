# Layout and Inventory System Implementation Plan

## Goal Description
Perform a comprehensive overhaul of the Layout and Inventory System. This includes fixing the broken "Add Unit" functionality, introducing complex editable geometries (curved roads, irregular polygons) for plotted layouts, adding a structured Apartment Layout generator, and automating the synchronization between published layouts and the project's inventory, with strict RBAC status control.

## User Review Required

> [!IMPORTANT]
> **Database Extension**
> I plan to add `layoutType` (String, default "PLOTTED") to the `ProjectLayout` Prisma model. This requires running `npx prisma db push`. This is a non-destructive additive change. Please confirm this is acceptable.

> [!IMPORTANT]
> **Apartment Layout Visualization**
> For Apartment Layouts, a single 2D canvas is difficult for multi-story buildings. My proposed approach:
> 1. When creating an "Apartment" Layout, the UI will feature an **Apartment Generator**.
> 2. You specify Tower Name, Floors, Units per Floor, Area, and Price.
> 3. Instead of forcing you to draw 100+ apartment units visually on a single 2D canvas, the editor will display "Towers" as graphical blocks on the Master Plan. 
> 4. The individual apartment units (e.g., A101, A102) will be generated logically in the layout's data structure and mapped to Inventory. 
> 5. If you *must* draw the exact physical geometry of every apartment unit floorplan, we will need to add a "Floor Selector" to the 2D canvas so you can draw units on specific floors. 
> **Question:** Is logically generating the apartment units under a Tower sufficient, or do you need a full 2D floorplan drawing tool for each individual floor?

## Proposed Changes

---

### Prisma Schema (`prisma/schema.prisma`)
- **[MODIFY]** `ProjectLayout`: Add `layoutType String @default("PLOTTED")`.

### Backend API & Services
- **[MODIFY]** `backend/src/validators/inventoryValidator.ts`:
  - Update `validateUpdateInventoryStatus` to accept all business statuses: `AVAILABLE`, `RESERVED`, `HOLD`, `BOOKED`, `REGISTERED`, `SOLD`.
- **[MODIFY]** `backend/src/controllers/layoutController.ts`:
  - Update `publishLayout` to iterate through all `layout.elements`.
  - For each `PLOT` or `APARTMENT_UNIT`, upsert an `InventoryUnit` record using `projectId` and `unitNumber` (to prevent duplicates on republish).
  - Update the `LayoutElement` with the resulting `inventoryUnitId`.
- **[MODIFY]** `backend/src/services/inventoryService.ts`:
  - In `updateInventoryStatus`, add an integration with `prisma.auditLog.create` to strictly log status changes, capturing the actor (MD/AM) and the status change.

### Frontend - Inventory List & Add Unit
- **[MODIFY]** `frontend/src/pages/projects/ProjectDetails.tsx`:
  - Connect the `+ Add Unit` button to a new `AddUnitModal` component.
  - In the Inventory List table, change the static Status text to an interactive `<select>` dropdown for MDs and Associate Managers. Changing the dropdown will trigger the `PATCH /api/inventory/:id/status` endpoint.
- **[NEW]** `frontend/src/components/projects/inventory/AddUnitModal.tsx`:
  - Form to manually add an `InventoryUnit` (Unit Number, Type, Size, Price, Status).

### Frontend - Layout Designer
- **[MODIFY]** `frontend/src/components/projects/layout-designer/LayoutDesigner.tsx`:
  - Add layout type selector logic.
  - Implement dynamic rendering of `Polygon` shapes for irregular plots based on `elementData.points`.
  - Implement `Line` shapes with `tension` (bezier curve) for curved roads based on `elementData.points`.
- **[MODIFY]** `frontend/src/components/projects/layout-designer/Toolbar.tsx`:
  - Add "Draw Polygon Plot" and "Draw Curved Road" tools.
  - Add "Apartment Generator" tool (visible if layout is APARTMENT type).
- **[NEW]** `frontend/src/components/projects/layout-designer/ApartmentGeneratorModal.tsx`:
  - Modal to input Tower Name, Floors (e.g. 10), Units per floor prefix (e.g. A), suffix padding, Area, and Price.
  - Auto-generates `LayoutElement`s representing units (A101, A102, etc.) and attaches them logically to the layout.

## Verification Plan

### Automated Tests
- `npx prisma validate` and `npx prisma generate`.
- `npm run build` to ensure TypeScript compilation succeeds without errors.

### Manual Verification
1. Open Project Details, click `+ Add Unit`, and verify it persists to MySQL.
2. Open Layout Designer, create a Plotted Layout, draw an irregular polygon plot and a curved road, and save.
3. Publish the layout and verify the plots automatically appear in the Inventory List.
4. From the Inventory List (as MD/AM), use the dropdown to change a unit's status from `Available` to `Reserved`. Verify the color updates on the layout canvas.
5. Create an Apartment Layout, use the generator to create Tower A with 5 floors and 4 units per floor, publish, and verify all 20 units appear in the Inventory List correctly prefixed.
