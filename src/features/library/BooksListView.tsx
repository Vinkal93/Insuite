import React, { useState, useEffect, useMemo } from "react";
import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  RefreshCw,
  AlertCircle,
  Eye,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Layers,
  Users,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import {
  listBooks,
  listCategories,
  listAuthors,
  listPublishers,
} from "@/services/libraryService";
import type {
  LibraryBook,
  LibraryCategory,
  LibraryAuthor,
  LibraryPublisher,
} from "@/types/library";
import { Button } from "@/components/ui/button";

const ITEMS_PER_PAGE = 10;

export const BooksListView: React.FC = () => {
  const { organization } = useAuth();
  const [books, setBooks] = useState<LibraryBook[]>([]);
  const [categories, setCategories] = useState<LibraryCategory[]>([]);
  const [authors, setAuthors] = useState<LibraryAuthor[]>([]);
  const [publishers, setPublishers] = useState<LibraryPublisher[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [selectedAuthor, setSelectedAuthor] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [currentPage, setCurrentPage] = useState(1);

  const loadBooksData = async () => {
    if (!organization) return;
    setIsLoading(true);
    setError(null);
    try {
      const [bList, catList, authList, pubList] = await Promise.all([
        listBooks(organization.id),
        listCategories(organization.id),
        listAuthors(organization.id),
        listPublishers(organization.id),
      ]);
      setBooks(bList);
      setCategories(catList);
      setAuthors(authList);
      setPublishers(pubList);
    } catch (err: any) {
      console.error("loadBooksData error:", err);
      setError(err.message || "Failed to load book catalog.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBooksData();
  }, [organization]);

  const filteredBooks = useMemo(() => {
    return books.filter((b) => {
      const matchesSearch =
        b.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (b.isbn && b.isbn.toLowerCase().includes(searchQuery.toLowerCase())) ||
        b.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        b.categoryName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "ALL" || b.categoryId === selectedCategory;
      const matchesAuth = selectedAuthor === "ALL" || b.authorId === selectedAuthor;
      const matchesStatus = selectedStatus === "ALL" || b.status === selectedStatus;

      return matchesSearch && matchesCat && matchesAuth && matchesStatus;
    });
  }, [books, searchQuery, selectedCategory, selectedAuthor, selectedStatus]);

  const totalPages = Math.ceil(filteredBooks.length / ITEMS_PER_PAGE) || 1;
  const paginatedBooks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBooks.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBooks, currentPage]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">
            Library Catalog & Inventory
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Manage book titles, physical copies, shelf placement, and availability.
          </p>
        </div>
        <Button variant="hero" size="sm" asChild className="rounded-xl text-xs font-bold shadow-soft">
          <Link to="/library/books/new">
            <Plus className="size-3.5 mr-1.5" /> Add New Book
          </Link>
        </Button>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-3xl border border-border bg-card p-4 shadow-soft">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search title, ISBN, author..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-2xl border border-border bg-surface pl-9 pr-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Author Filter */}
          <select
            value={selectedAuthor}
            onChange={(e) => {
              setSelectedAuthor(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Authors</option>
            {authors.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setCurrentPage(1);
            }}
            className="rounded-2xl border border-border bg-surface px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Content Table / Cards */}
      {isLoading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-destructive/20 bg-destructive/5 p-8 text-center">
          <AlertCircle className="size-8 text-destructive mx-auto" />
          <p className="mt-2 text-xs font-bold text-foreground">{error}</p>
          <Button onClick={loadBooksData} variant="outline" size="sm" className="mt-3 text-xs">
            <RefreshCw className="size-3.5 mr-1" /> Retry
          </Button>
        </div>
      ) : filteredBooks.length === 0 ? (
        <div className="rounded-3xl border border-border bg-card p-12 text-center">
          <BookOpen className="size-10 text-muted-foreground mx-auto" />
          <h3 className="mt-3 text-sm font-bold text-foreground">No books found in the catalog</h3>
          <p className="mt-1 text-xs text-muted-foreground">
            Try adjusting your search criteria or register a new book title.
          </p>
          <Button variant="outline" size="sm" asChild className="mt-4 rounded-xl text-xs">
            <Link to="/library/books/new">
              <Plus className="size-3.5 mr-1" /> Add New Book
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop Table */}
          <div className="hidden md:block rounded-3xl border border-border bg-card overflow-hidden shadow-soft">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface/50 font-bold text-muted-foreground">
                  <th className="py-3 px-4">Book Title</th>
                  <th className="py-3 px-4">ISBN</th>
                  <th className="py-3 px-4">Author</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Publisher</th>
                  <th className="py-3 px-4">Total Copies</th>
                  <th className="py-3 px-4">Available</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {paginatedBooks.map((book) => (
                  <tr key={book.id} className="hover:bg-surface/50 transition-colors">
                    <td className="py-3 px-4">
                      <p className="font-bold text-foreground">{book.title}</p>
                      {book.subtitle && (
                        <p className="text-[10px] text-muted-foreground truncate max-w-[200px]">
                          {book.subtitle}
                        </p>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-muted-foreground">
                      {book.isbn || "—"}
                    </td>
                    <td className="py-3 px-4 text-foreground font-medium">{book.authorName}</td>
                    <td className="py-3 px-4 text-muted-foreground">{book.categoryName}</td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {book.publisherName || "—"}
                    </td>
                    <td className="py-3 px-4 font-semibold text-foreground">
                      {book.totalCopies}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-bold text-emerald-600">{book.availableCopies}</span>
                      <span className="text-[10px] text-muted-foreground"> / {book.totalCopies}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          book.status === "Active"
                            ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                            : "bg-muted text-muted-foreground border-border"
                        }`}
                      >
                        {book.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link to="/library/books/$bookId" params={{ bookId: book.id }}>
                            <Eye className="size-3.5 mr-1" /> View
                          </Link>
                        </Button>
                        <Button variant="ghost" size="sm" asChild className="h-7 px-2 text-xs">
                          <Link to="/library/books/$bookId/edit" params={{ bookId: book.id }}>
                            <Edit2 className="size-3.5 text-muted-foreground" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {paginatedBooks.map((book) => (
              <div
                key={book.id}
                className="rounded-3xl border border-border bg-card p-4 shadow-soft space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-bold text-sm text-foreground">{book.title}</p>
                    <p className="text-xs text-muted-foreground">by {book.authorName}</p>
                  </div>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      book.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {book.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] bg-surface/50 p-2.5 rounded-2xl border border-border">
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Category</span>
                    <span className="font-semibold text-foreground">{book.categoryName}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground block text-[10px]">Available</span>
                    <span className="font-bold text-emerald-600">
                      {book.availableCopies} of {book.totalCopies}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/library/books/$bookId" params={{ bookId: book.id }}>
                      View Details
                    </Link>
                  </Button>
                  <Button variant="ghost" size="sm" asChild className="rounded-xl text-xs h-8">
                    <Link to="/library/books/$bookId/edit" params={{ bookId: book.id }}>
                      Edit
                    </Link>
                  </Button>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">
                Showing page {currentPage} of {totalPages} ({filteredBooks.length} titles)
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="rounded-xl text-xs h-8"
                >
                  <ChevronLeft className="size-3.5 mr-1" /> Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded-xl text-xs h-8"
                >
                  Next <ChevronRight className="size-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
