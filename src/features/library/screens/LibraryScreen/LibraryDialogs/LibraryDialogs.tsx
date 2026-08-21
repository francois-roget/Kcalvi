import { ArchiveRecipeSheet } from '../ArchiveRecipeSheet';
import { DeleteFoodSheet } from '../DeleteFoodSheet';
import type { useFoodDeleteFlow, useRecipeArchiveFlow } from '../LibraryScreen.helpers';

export type LibraryDialogsProps = {
  deleteFlow: ReturnType<typeof useFoodDeleteFlow>;
  archiveFlow: ReturnType<typeof useRecipeArchiveFlow>;
};

/** Renders both confirmation sheets unconditionally -- each is internally gated on its own
 *  pending-item state (`visible={food !== null}` / `visible={recipe !== null}`). */
export function LibraryDialogs({ deleteFlow, archiveFlow }: LibraryDialogsProps) {
  return (
    <>
      <DeleteFoodSheet
        food={deleteFlow.foodPendingDeletion}
        deletability={deleteFlow.deletability}
        errorMessage={deleteFlow.errorMessage}
        onCancel={deleteFlow.cancelDelete}
        onConfirmDelete={deleteFlow.confirmDelete}
        onArchiveInstead={deleteFlow.archiveInstead}
      />

      <ArchiveRecipeSheet
        recipe={archiveFlow.recipePendingArchive}
        errorMessage={archiveFlow.errorMessage}
        onCancel={archiveFlow.cancelArchive}
        onConfirmArchive={archiveFlow.confirmArchive}
      />
    </>
  );
}

export default LibraryDialogs;
