/**
 * Barrel exports for the data-table module: toolbar, header, settings modal, and selection column factory.
 * The actual table rendering is handled by @tanstack/react-table in the consuming page.
 */
import { DataTableHeader } from "@/modules/ui/components/data-table/components/data-table-header";
import { DataTableSettingsModal } from "@/modules/ui/components/data-table/components/data-table-settings-modal";
import { DataTableToolbar } from "@/modules/ui/components/data-table/components/data-table-toolbar";
import { getSelectionColumn } from "@/modules/ui/components/data-table/components/selection-column";

export { DataTableToolbar, DataTableHeader, DataTableSettingsModal, getSelectionColumn };
