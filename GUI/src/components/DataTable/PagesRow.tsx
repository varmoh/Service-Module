import React, { useCallback } from "react";
import { Table } from "@tanstack/react-table";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import clsx from 'clsx'

interface PagesRowProps {
  table: Table<any>;
  setPageIndex: React.Dispatch<React.SetStateAction<number>>;
}

const PagesRow: React.FC<PagesRowProps> = ({ table, setPageIndex }) => {
  const { t } = useTranslation();
  const pagesShown = 7;

  const getPages = useCallback(() => {
    const current = table.getState().pagination.pageIndex;
    const pages: number[] = [];
    const lastShownPage = Math.min(table.getPageCount(), current + pagesShown);

    pages.push(current);
    for (; pages.length < Math.min(pagesShown, table.getPageCount());) {
      if (pages[0] > 0) pages.unshift(pages[0] - 1);
      if (pages[pages.length - 1] + 1 < lastShownPage) {
        pages.push(pages[pages.length - 1] + 1);
      }
    }

    return pages;
  }, [table, pagesShown]);

  return (
    <nav role="navigation" aria-label={t('global.paginationNavigation') || ''}>
      <ul className="links">
        {getPages().map((page, i) => {
          if ((i === 0 && page !== 0) ||
            (i === pagesShown - 1 && page !== table.getPageCount() - 1)) {
            return <p key={page}>...</p>;
          }
          return (
            <li
              key={page}
              className={clsx({ active: table.getState().pagination.pageIndex === page })}
            >
              <Link
                to={`?page=${page + 1}`}
                onClick={() => setPageIndex(page)}
                aria-label={t('global.gotoPage') + page}
                aria-current={table.getState().pagination.pageIndex === page}
              >
                {page + 1}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default PagesRow;
