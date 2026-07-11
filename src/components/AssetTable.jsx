import React from "react";

const statusStyles = {
  "In Stock": "bg-emerald-100 text-emerald-800 border border-emerald-200",
  "Low Stock": "bg-amber-100 text-amber-800 border border-amber-200",
  "Out of Stock": "bg-red-100 text-red-800 border border-red-200",
};

const iconBtn =
  "inline-flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:text-blue-500 hover:bg-gray-100 transition transform hover:scale-110";

const truncate = (str, max = 24) =>
  str && str.length > max ? str.slice(0, max) + "…" : str;

const AssetTable = ({
  assets,
  currentUserRole,
  onViewAsset,
  onEditAsset,
  onDeleteAsset,
  onReduceAsset,
}) => {
  const isAdmin = currentUserRole === "admin" || currentUserRole === "manager";

  if (!assets.length) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-500 font-medium">📭 No assets found</p>
        <p className="text-sm text-gray-600 mt-2">
          Try adjusting your search filters
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto -mx-2">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Asset Name
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Category
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Quantity
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Status
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Unit Cost
            </th>
            <th className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {assets.map((asset) => (
            <tr
              key={asset.id}
              className="group relative border-b border-gray-200 last:border-b-0 hover:bg-gray-50 transition-all duration-200"
            >
              {/* Asset Name + Vendor + SKU */}
              <td className="relative px-6 py-4">
                <button
                  type="button"
                  onClick={() => onViewAsset(asset)}
                  className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-colors text-left group/link"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-xs font-bold text-white">
                      {/* {asset.name.charAt(0)} */}
                      {(asset.name || "Unknown").charAt(0)}
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div
                        className="font-semibold text-gray-900 group-hover/link:text-blue-600"
                        title={asset.name}
                      >
                        {truncate(asset.name)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        {asset.vendor && (
                          <span>{truncate(asset.vendor, 18)} · </span>
                        )}
                        <span className="font-mono">{asset.sku}</span>
                      </div>
                    </div>
                  </div>
                </button>
              </td>

              {/* Category */}
              <td className="relative px-6 py-4">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-gray-100 border border-gray-200 text-xs font-medium text-gray-700">
                  {asset.category}
                </span>
              </td>

              {/* Quantity */}
              <td className="relative px-6 py-4">
                <div className="text-sm font-bold text-gray-900">
                  {asset.quantity}
                  {asset.unit && (
                    <span className="text-xs font-normal text-gray-400 ml-1">
                      {asset.unit}
                    </span>
                  )}
                </div>
              </td>

              {/* Status */}
              <td className="relative px-6 py-4">
                <span
                  className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide ${statusStyles[asset.status] ?? statusStyles["In Stock"]}`}
                >
                  {asset.status}
                </span>
              </td>

              {/* Unit Cost */}
              <td className="relative px-6 py-4">
                <div className="text-sm font-semibold text-gray-700">
                  {asset.value?.toLocaleString()}{" "}
                  <span className="text-xs text-gray-400">
                    {asset.currency ?? "SAR"}
                  </span>
                </div>
              </td>

              {/* Actions */}
              <td className="relative px-6 py-4">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onViewAsset(asset)}
                    className={iconBtn}
                    title="View details"
                  >
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>

                  {isAdmin ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onEditAsset(asset)}
                        className={`${iconBtn} hover:text-blue-600 hover:bg-blue-100`}
                        title="Edit asset"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <path d="M12 20h9" />
                          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteAsset(asset)}
                        className={`${iconBtn} hover:text-red-600 hover:bg-red-100`}
                        title="Delete asset"
                      >
                        <svg
                          width="15"
                          height="15"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                          <path d="M10 11v6M14 11v6M9 6V4h6v2" />
                        </svg>
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onReduceAsset(asset)}
                      className={`${iconBtn} hover:text-amber-600 hover:bg-amber-100`}
                      title="Reduce stock"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      >
                        <line x1="5" y1="12" x2="19" y2="12" />
                      </svg>
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AssetTable;
