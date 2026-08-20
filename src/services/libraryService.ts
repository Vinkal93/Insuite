import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  serverTimestamp,
  writeBatch,
  runTransaction,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  LibraryBook,
  LibraryBookCopy,
  LibraryCategory,
  LibraryAuthor,
  LibraryPublisher,
  LibraryMember,
  LibraryTransaction,
  LibraryReservation,
  LibraryFine,
  LibrarySettingsConfig,
  LibraryDashboardStats,
  BookCopyStatus,
  LibraryTransactionStatus,
  LibraryReservationStatus,
  LibraryFineStatus,
} from "@/types/library";
import type {
  LibraryBookInput,
  LibraryCategoryInput,
  LibraryAuthorInput,
  LibraryPublisherInput,
  LibraryCopyInput,
  IssueBookInput,
  ReturnBookInput,
  ReserveBookInput,
  WaiveFineInput,
  LibrarySettingsInput,
} from "@/schemas/library";
import { createAuditLog } from "./auditService";
import { listStudents } from "./studentService";
import { listStaff } from "./hrService";

export const DEFAULT_LIBRARY_SETTINGS: LibrarySettingsConfig = {
  studentLoanLimit: 3,
  staffLoanLimit: 6,
  defaultLoanDurationDays: 14,
  maxRenewals: 2,
  finePerDay: 5,
  reservationExpiryDays: 3,
  accessionPrefix: "LIB",
  autoGenerateAccessionNumber: true,
};

// ----------------------------------------------------
// 1. SETTINGS & ACCESSION NUMBER GENERATOR
// ----------------------------------------------------

export const getLibrarySettings = async (orgId: string): Promise<LibrarySettingsConfig> => {
  try {
    const docRef = doc(db, "organizations", orgId, "librarySettings", "config");
    const snap = await getDoc(docRef);
    if (!snap.exists()) return DEFAULT_LIBRARY_SETTINGS;
    return { ...DEFAULT_LIBRARY_SETTINGS, ...snap.data() } as LibrarySettingsConfig;
  } catch (err) {
    console.error("getLibrarySettings error:", err);
    return DEFAULT_LIBRARY_SETTINGS;
  }
};

export const updateLibrarySettings = async (
  orgId: string,
  input: LibrarySettingsInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "librarySettings", "config");
  await setDoc(
    docRef,
    {
      ...input,
      updatedAt: new Date().toISOString(),
      updatedBy: actor.uid,
    },
    { merge: true }
  );

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "LIBRARY_SETTINGS_UPDATED",
    entityType: "LIBRARY_SETTINGS",
    entityId: "config",
  });
};

export const generateNextAccessionNumber = async (
  orgId: string,
  prefix = "LIB"
): Promise<string> => {
  const currentYear = new Date().getFullYear();
  const counterRef = doc(db, "organizations", orgId, "counters", "accessions");
  return await runTransaction(db, async (txn) => {
    const snap = await txn.get(counterRef);
    let nextCount = 1;
    if (snap.exists()) {
      nextCount = (snap.data().lastCount || 0) + 1;
    }
    txn.set(counterRef, { lastCount: nextCount, updatedAt: serverTimestamp() }, { merge: true });
    const padded = String(nextCount).padStart(6, "0");
    return `${prefix}-${currentYear}-${padded}`;
  });
};

// ----------------------------------------------------
// 2. CATEGORIES, AUTHORS, PUBLISHERS CRUD
// ----------------------------------------------------

export const listCategories = async (orgId: string): Promise<LibraryCategory[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryCategories");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LibraryCategory);
};

export const createCategory = async (
  orgId: string,
  input: LibraryCategoryInput,
  actor: { uid: string; name: string }
): Promise<LibraryCategory> => {
  const docRef = doc(collection(db, "organizations", orgId, "libraryCategories"));
  const now = new Date().toISOString();
  const category: LibraryCategory = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    code: input.code.toUpperCase(),
    description: input.description || null,
    booksCount: 0,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, category);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "CATEGORY_CREATED",
    entityType: "LIBRARY_CATEGORY",
    entityId: docRef.id,
    metadata: { name: category.name, code: category.code },
  });

  return category;
};

export const updateCategory = async (
  orgId: string,
  id: string,
  input: Partial<LibraryCategoryInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "libraryCategories", id);
  await updateDoc(docRef, {
    ...input,
    code: input.code ? input.code.toUpperCase() : undefined,
    updatedAt: new Date().toISOString(),
  });
  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "CATEGORY_UPDATED",
    entityType: "LIBRARY_CATEGORY",
    entityId: id,
  });
};

export const listAuthors = async (orgId: string): Promise<LibraryAuthor[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryAuthors");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LibraryAuthor);
};

export const createAuthor = async (
  orgId: string,
  input: LibraryAuthorInput,
  actor: { uid: string; name: string }
): Promise<LibraryAuthor> => {
  const docRef = doc(collection(db, "organizations", orgId, "libraryAuthors"));
  const now = new Date().toISOString();
  const author: LibraryAuthor = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    biography: input.biography || null,
    booksCount: 0,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, author);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "AUTHOR_CREATED",
    entityType: "LIBRARY_AUTHOR",
    entityId: docRef.id,
    metadata: { name: author.name },
  });

  return author;
};

export const updateAuthor = async (
  orgId: string,
  id: string,
  input: Partial<LibraryAuthorInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "libraryAuthors", id);
  await updateDoc(docRef, {
    ...input,
    updatedAt: new Date().toISOString(),
  });
  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "AUTHOR_UPDATED",
    entityType: "LIBRARY_AUTHOR",
    entityId: id,
  });
};

export const listPublishers = async (orgId: string): Promise<LibraryPublisher[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryPublishers");
  const q = query(colRef, orderBy("name", "asc"));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LibraryPublisher);
};

export const createPublisher = async (
  orgId: string,
  input: LibraryPublisherInput,
  actor: { uid: string; name: string }
): Promise<LibraryPublisher> => {
  const docRef = doc(collection(db, "organizations", orgId, "libraryPublishers"));
  const now = new Date().toISOString();
  const publisher: LibraryPublisher = {
    id: docRef.id,
    organizationId: orgId,
    name: input.name,
    contact: input.contact || null,
    website: input.website || null,
    booksCount: 0,
    status: input.status || "Active",
    createdAt: now,
    updatedAt: now,
  };
  await setDoc(docRef, publisher);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PUBLISHER_CREATED",
    entityType: "LIBRARY_PUBLISHER",
    entityId: docRef.id,
    metadata: { name: publisher.name },
  });

  return publisher;
};

export const updatePublisher = async (
  orgId: string,
  id: string,
  input: Partial<LibraryPublisherInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "libraryPublishers", id);
  await updateDoc(docRef, {
    ...input,
    updatedAt: new Date().toISOString(),
  });
  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "PUBLISHER_UPDATED",
    entityType: "LIBRARY_PUBLISHER",
    entityId: id,
  });
};

// ----------------------------------------------------
// 3. BOOKS & COPIES CRUD
// ----------------------------------------------------

export const createBook = async (
  orgId: string,
  input: LibraryBookInput,
  actor: { uid: string; name: string }
): Promise<LibraryBook> => {
  const bookRef = doc(collection(db, "organizations", orgId, "libraryBooks"));
  const bookId = bookRef.id;
  const now = new Date().toISOString();

  const settings = await getLibrarySettings(orgId);

  const book: LibraryBook = {
    id: bookId,
    organizationId: orgId,
    title: input.title,
    subtitle: input.subtitle || null,
    isbn: input.isbn || null,
    language: input.language || "English",
    edition: input.edition || null,
    publicationYear: input.publicationYear || null,
    description: input.description || null,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    authorId: input.authorId,
    authorName: input.authorName,
    publisherId: input.publisherId || null,
    publisherName: input.publisherName || null,
    subject: input.subject || null,
    tags: input.tags || [],
    coverUrl: input.coverUrl || null,
    format: input.format || "Physical",
    totalCopies: input.totalCopies,
    availableCopies: input.totalCopies,
    issuedCopies: 0,
    shelf: input.shelf || null,
    rack: input.rack || null,
    location: input.location || null,
    issueAllowed: input.issueAllowed,
    renewalAllowed: input.renewalAllowed,
    maximumRenewals: input.maximumRenewals,
    loanDurationDays: input.loanDurationDays,
    fineApplicable: input.fineApplicable,
    status: input.status || "Active",
    createdAt: now,
    createdBy: actor.uid,
    updatedAt: now,
    updatedBy: actor.uid,
  };

  const batch = writeBatch(db);
  batch.set(bookRef, book);

  // Generate individual physical copies
  for (let i = 0; i < input.totalCopies; i++) {
    const copyRef = doc(collection(db, "organizations", orgId, "libraryBookCopies"));
    const accessionNumber = await generateNextAccessionNumber(
      orgId,
      settings.accessionPrefix || "LIB"
    );

    const copy: LibraryBookCopy = {
      id: copyRef.id,
      organizationId: orgId,
      bookId,
      accessionNumber,
      condition: "New",
      shelf: input.shelf || null,
      rack: input.rack || null,
      location: input.location || null,
      status: "Available",
      createdAt: now,
      updatedAt: now,
    };
    batch.set(copyRef, copy);
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BOOK_CREATED",
    entityType: "LIBRARY_BOOK",
    entityId: bookId,
    metadata: { title: book.title, copies: input.totalCopies, category: input.categoryName },
  });

  return book;
};

export const getBook = async (orgId: string, bookId: string): Promise<LibraryBook | null> => {
  const docRef = doc(db, "organizations", orgId, "libraryBooks", bookId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return null;
  return snap.data() as LibraryBook;
};

export const updateBook = async (
  orgId: string,
  bookId: string,
  input: Partial<LibraryBookInput>,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "libraryBooks", bookId);
  await updateDoc(docRef, {
    ...input,
    updatedAt: new Date().toISOString(),
    updatedBy: actor.uid,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BOOK_UPDATED",
    entityType: "LIBRARY_BOOK",
    entityId: bookId,
  });
};

export const listBooks = async (
  orgId: string,
  filters?: {
    categoryId?: string;
    authorId?: string;
    publisherId?: string;
    status?: string;
  }
): Promise<LibraryBook[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryBooks");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as LibraryBook);

  if (filters?.categoryId && filters.categoryId !== "ALL") {
    list = list.filter((b) => b.categoryId === filters.categoryId);
  }
  if (filters?.authorId && filters.authorId !== "ALL") {
    list = list.filter((b) => b.authorId === filters.authorId);
  }
  if (filters?.publisherId && filters.publisherId !== "ALL") {
    list = list.filter((b) => b.publisherId === filters.publisherId);
  }
  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((b) => b.status === filters.status);
  }

  return list;
};

export const listBookCopies = async (
  orgId: string,
  bookId: string
): Promise<LibraryBookCopy[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryBookCopies");
  const q = query(colRef, where("bookId", "==", bookId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data() as LibraryBookCopy);
};

export const addBookCopy = async (
  orgId: string,
  bookId: string,
  input: LibraryCopyInput,
  actor: { uid: string; name: string }
): Promise<LibraryBookCopy> => {
  const settings = await getLibrarySettings(orgId);
  const accessionNumber = await generateNextAccessionNumber(
    orgId,
    settings.accessionPrefix || "LIB"
  );
  const copyRef = doc(collection(db, "organizations", orgId, "libraryBookCopies"));
  const now = new Date().toISOString();

  const copy: LibraryBookCopy = {
    id: copyRef.id,
    organizationId: orgId,
    bookId,
    accessionNumber,
    condition: input.condition || "New",
    shelf: input.shelf || null,
    rack: input.rack || null,
    location: input.location || null,
    status: input.status || "Available",
    createdAt: now,
    updatedAt: now,
  };

  const bookRef = doc(db, "organizations", orgId, "libraryBooks", bookId);
  const snap = await getDoc(bookRef);
  if (!snap.exists()) throw new Error("Book not found.");
  const book = snap.data() as LibraryBook;

  const batch = writeBatch(db);
  batch.set(copyRef, copy);
  batch.update(bookRef, {
    totalCopies: book.totalCopies + 1,
    availableCopies: copy.status === "Available" ? book.availableCopies + 1 : book.availableCopies,
    updatedAt: now,
  });

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BOOK_COPY_ADDED",
    entityType: "LIBRARY_COPY",
    entityId: copyRef.id,
    metadata: { bookId, accessionNumber },
  });

  return copy;
};

// ----------------------------------------------------
// 4. MEMBERS INTEGRATION (STUDENTS & STAFF)
// ----------------------------------------------------

export const searchLibraryMembers = async (
  orgId: string,
  searchTerm?: string
): Promise<LibraryMember[]> => {
  const [students, staffList, transactionsSnap, finesSnap] = await Promise.all([
    listStudents(orgId),
    listStaff(orgId, { status: "Active" }),
    getDocs(
      query(
        collection(db, "organizations", orgId, "libraryTransactions"),
        where("status", "==", "Issued")
      )
    ),
    getDocs(
      query(
        collection(db, "organizations", orgId, "libraryFines"),
        where("status", "==", "Pending")
      )
    ),
  ]);

  const activeTransactions = transactionsSnap.docs.map((d) => d.data() as LibraryTransaction);
  const activeFines = finesSnap.docs.map((d) => d.data() as LibraryFine);

  const studentMembers: LibraryMember[] = students.map((s) => {
    const issuedCount = activeTransactions.filter(
      (t) => t.memberId === s.id && t.memberType === "Student"
    ).length;
    const fineTotal = activeFines
      .filter((f) => f.memberId === s.id && f.memberType === "Student")
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      id: s.id,
      organizationId: orgId,
      memberType: "Student",
      name: `${s.personal.firstName} ${s.personal.lastName}`,
      identifier: s.admissionNumber || s.id,
      departmentOrClass: `${s.academic.className || "Class"} - ${s.academic.sectionName || "A"}`,
      contactMobile: s.contact.mobile,
      contactEmail: s.contact.email,
      photoUrl: s.personal.photoUrl,
      status: s.status === "active" ? "Active" : "Inactive",
      booksIssuedCount: issuedCount,
      activeFinesAmount: fineTotal,
      createdAt: s.createdAt || new Date().toISOString(),
    };
  });

  const staffMembers: LibraryMember[] = staffList.map((st) => {
    const issuedCount = activeTransactions.filter(
      (t) => t.memberId === st.id && t.memberType === "Staff"
    ).length;
    const fineTotal = activeFines
      .filter((f) => f.memberId === st.id && f.memberType === "Staff")
      .reduce((sum, f) => sum + f.amount, 0);

    return {
      id: st.id,
      organizationId: orgId,
      memberType: "Staff",
      name: st.fullName,
      identifier: st.employeeId,
      departmentOrClass: `${st.professional.departmentName} (${st.professional.designationName})`,
      contactMobile: st.contact.mobile,
      contactEmail: st.contact.email,
      photoUrl: st.personal.photoUrl,
      status: st.status === "Active" ? "Active" : "Inactive",
      booksIssuedCount: issuedCount,
      activeFinesAmount: fineTotal,
      createdAt: st.createdAt,
    };
  });

  let allMembers = [...studentMembers, ...staffMembers];

  if (searchTerm && searchTerm.trim()) {
    const qLower = searchTerm.toLowerCase();
    allMembers = allMembers.filter(
      (m) =>
        m.name.toLowerCase().includes(qLower) ||
        m.identifier.toLowerCase().includes(qLower) ||
        (m.contactMobile && m.contactMobile.includes(qLower))
    );
  }

  return allMembers;
};

// ----------------------------------------------------
// 5. TRANSACTIONS & CIRCULATION (ISSUE, RETURN, RENEW)
// ----------------------------------------------------

export const issueBook = async (
  orgId: string,
  input: IssueBookInput,
  actor: { uid: string; name: string }
): Promise<LibraryTransaction> => {
  const [bookSnap, copySnap, memberList, settings] = await Promise.all([
    getDoc(doc(db, "organizations", orgId, "libraryBooks", input.bookId)),
    getDoc(doc(db, "organizations", orgId, "libraryBookCopies", input.copyId)),
    searchLibraryMembers(orgId),
    getLibrarySettings(orgId),
  ]);

  if (!bookSnap.exists()) throw new Error("Book record not found.");
  if (!copySnap.exists()) throw new Error("Copy record not found.");

  const book = bookSnap.data() as LibraryBook;
  const copy = copySnap.data() as LibraryBookCopy;
  const member = memberList.find((m) => m.id === input.memberId && m.memberType === input.memberType);

  if (!member) throw new Error("Member not found.");
  if (member.status !== "Active") throw new Error("Member is not active / suspended.");
  if (copy.status !== "Available") throw new Error(`Copy ${copy.accessionNumber} is currently ${copy.status}.`);

  const loanLimit = input.memberType === "Student" ? settings.studentLoanLimit : settings.staffLoanLimit;
  if (member.booksIssuedCount >= loanLimit) {
    throw new Error(`Member has reached borrowing limit of ${loanLimit} book(s).`);
  }

  const transactionRef = doc(collection(db, "organizations", orgId, "libraryTransactions"));
  const now = new Date().toISOString();

  const transaction: LibraryTransaction = {
    id: transactionRef.id,
    organizationId: orgId,
    bookId: input.bookId,
    bookTitle: book.title,
    bookCoverUrl: book.coverUrl || null,
    copyId: input.copyId,
    accessionNumber: copy.accessionNumber,
    memberType: input.memberType,
    memberId: input.memberId,
    memberName: member.name,
    memberIdentifier: member.identifier,
    issuedAt: now,
    issuedBy: actor.uid,
    issuedByName: actor.name,
    dueAt: input.dueAt,
    renewalCount: 0,
    status: "Issued",
    remarks: input.remarks || null,
    createdAt: now,
    updatedAt: now,
  };

  const batch = writeBatch(db);
  batch.set(transactionRef, transaction);
  batch.update(doc(db, "organizations", orgId, "libraryBookCopies", input.copyId), {
    status: "Issued",
    updatedAt: now,
  });
  batch.update(doc(db, "organizations", orgId, "libraryBooks", input.bookId), {
    availableCopies: Math.max(0, book.availableCopies - 1),
    issuedCopies: book.issuedCopies + 1,
    updatedAt: now,
  });

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BOOK_ISSUED",
    entityType: "LIBRARY_TRANSACTION",
    entityId: transactionRef.id,
    metadata: {
      bookTitle: book.title,
      accessionNumber: copy.accessionNumber,
      memberName: member.name,
      dueAt: input.dueAt,
    },
  });

  return transaction;
};

export const returnBook = async (
  orgId: string,
  input: ReturnBookInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const transDocRef = doc(db, "organizations", orgId, "libraryTransactions", input.transactionId);
  const transSnap = await getDoc(transDocRef);
  if (!transSnap.exists()) throw new Error("Transaction not found.");

  const transaction = transSnap.data() as LibraryTransaction;
  if (transaction.status !== "Issued") {
    throw new Error(`Transaction is already marked as ${transaction.status}.`);
  }

  const [bookSnap, copySnap, settings] = await Promise.all([
    getDoc(doc(db, "organizations", orgId, "libraryBooks", transaction.bookId)),
    getDoc(doc(db, "organizations", orgId, "libraryBookCopies", transaction.copyId)),
    getLibrarySettings(orgId),
  ]);

  const now = new Date().toISOString();
  const todayDateStr = now.split("T")[0];

  // Calculate overdue fine
  let daysOverdue = 0;
  let fineAmount = 0;
  const dueDate = new Date(transaction.dueAt).getTime();
  const todayDate = new Date(todayDateStr).getTime();
  if (todayDate > dueDate) {
    daysOverdue = Math.ceil((todayDate - dueDate) / (1000 * 60 * 60 * 24));
    fineAmount = daysOverdue * (settings.finePerDay || 5);
  }

  const batch = writeBatch(db);

  // Update Transaction
  batch.update(transDocRef, {
    returnedAt: now,
    returnedBy: actor.uid,
    returnedByName: actor.name,
    status: "Returned",
    fineAmount,
    finePaid: input.payFineNow && fineAmount > 0,
    remarks: input.remarks || transaction.remarks || null,
    updatedAt: now,
  });

  // Restore Copy to Available
  if (copySnap.exists()) {
    batch.update(doc(db, "organizations", orgId, "libraryBookCopies", transaction.copyId), {
      status: "Available",
      updatedAt: now,
    });
  }

  // Restore Book availability
  if (bookSnap.exists()) {
    const book = bookSnap.data() as LibraryBook;
    batch.update(doc(db, "organizations", orgId, "libraryBooks", transaction.bookId), {
      availableCopies: book.availableCopies + 1,
      issuedCopies: Math.max(0, book.issuedCopies - 1),
      updatedAt: now,
    });
  }

  // Create Fine Record if overdue
  if (fineAmount > 0) {
    const fineDocRef = doc(collection(db, "organizations", orgId, "libraryFines"));
    const fineRecord: LibraryFine = {
      id: fineDocRef.id,
      organizationId: orgId,
      transactionId: transaction.id,
      bookId: transaction.bookId,
      bookTitle: transaction.bookTitle,
      copyId: transaction.copyId,
      accessionNumber: transaction.accessionNumber,
      memberType: transaction.memberType,
      memberId: transaction.memberId,
      memberName: transaction.memberName,
      daysOverdue,
      amount: fineAmount,
      reason: `Late return by ${daysOverdue} day(s) for "${transaction.bookTitle}"`,
      status: input.payFineNow ? "Paid" : "Pending",
      paidAt: input.payFineNow ? now : null,
      paidBy: input.payFineNow ? actor.uid : null,
      paidByName: input.payFineNow ? actor.name : null,
      paymentMethod: input.payFineNow ? input.paymentMethod || "Cash" : null,
      transactionReference: input.payFineNow ? input.transactionReference || null : null,
      createdAt: now,
      updatedAt: now,
    };
    batch.set(fineDocRef, fineRecord);
  }

  await batch.commit();

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BOOK_RETURNED",
    entityType: "LIBRARY_TRANSACTION",
    entityId: transaction.id,
    metadata: {
      bookTitle: transaction.bookTitle,
      accessionNumber: transaction.accessionNumber,
      daysOverdue,
      fineAmount,
    },
  });
};

export const renewBook = async (
  orgId: string,
  transactionId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const transDocRef = doc(db, "organizations", orgId, "libraryTransactions", transactionId);
  const transSnap = await getDoc(transDocRef);
  if (!transSnap.exists()) throw new Error("Transaction not found.");

  const transaction = transSnap.data() as LibraryTransaction;
  if (transaction.status !== "Issued") {
    throw new Error("Only currently issued books can be renewed.");
  }

  const [bookSnap, settings] = await Promise.all([
    getDoc(doc(db, "organizations", orgId, "libraryBooks", transaction.bookId)),
    getLibrarySettings(orgId),
  ]);

  if (bookSnap.exists()) {
    const book = bookSnap.data() as LibraryBook;
    if (!book.renewalAllowed) throw new Error("Renewals are disabled for this book.");
    if (transaction.renewalCount >= (book.maximumRenewals || settings.maxRenewals)) {
      throw new Error(`Maximum renewals limit (${book.maximumRenewals || settings.maxRenewals}) reached.`);
    }
  }

  // Extend due date
  const duration = settings.defaultLoanDurationDays || 14;
  const currentDueDate = new Date(transaction.dueAt);
  currentDueDate.setDate(currentDueDate.getDate() + duration);
  const newDueDateStr = currentDueDate.toISOString().split("T")[0];
  const now = new Date().toISOString();

  await updateDoc(transDocRef, {
    dueAt: newDueDateStr,
    renewalCount: transaction.renewalCount + 1,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "BOOK_RENEWED",
    entityType: "LIBRARY_TRANSACTION",
    entityId: transactionId,
    metadata: { newDueAt: newDueDateStr, renewalCount: transaction.renewalCount + 1 },
  });
};

export const listTransactions = async (
  orgId: string,
  filters?: {
    status?: string;
    memberId?: string;
    bookId?: string;
  }
): Promise<LibraryTransaction[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryTransactions");
  const q = query(colRef, orderBy("issuedAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as LibraryTransaction);

  if (filters?.status && filters.status !== "ALL") {
    list = list.filter((t) => t.status === filters.status);
  }
  if (filters?.memberId) {
    list = list.filter((t) => t.memberId === filters.memberId);
  }
  if (filters?.bookId) {
    list = list.filter((t) => t.bookId === filters.bookId);
  }

  return list;
};

// ----------------------------------------------------
// 6. RESERVATIONS MANAGEMENT
// ----------------------------------------------------

export const listReservations = async (
  orgId: string,
  status?: string
): Promise<LibraryReservation[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryReservations");
  const q = query(colRef, orderBy("reservedAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as LibraryReservation);

  if (status && status !== "ALL") {
    list = list.filter((r) => r.status === status);
  }

  return list;
};

export const reserveBook = async (
  orgId: string,
  input: ReserveBookInput,
  actor: { uid: string; name: string }
): Promise<LibraryReservation> => {
  const [bookSnap, memberList, existingRes, settings] = await Promise.all([
    getDoc(doc(db, "organizations", orgId, "libraryBooks", input.bookId)),
    searchLibraryMembers(orgId),
    listReservations(orgId, "Pending"),
    getLibrarySettings(orgId),
  ]);

  if (!bookSnap.exists()) throw new Error("Book not found.");
  const book = bookSnap.data() as LibraryBook;

  const member = memberList.find((m) => m.id === input.memberId && m.memberType === input.memberType);
  if (!member) throw new Error("Member not found.");

  // Check duplicate active reservation
  const alreadyReserved = existingRes.some(
    (r) => r.bookId === input.bookId && r.memberId === input.memberId && r.status === "Pending"
  );
  if (alreadyReserved) throw new Error("Member already has an active reservation for this book.");

  const now = new Date();
  const expiresAtDate = new Date();
  expiresAtDate.setDate(expiresAtDate.getDate() + (settings.reservationExpiryDays || 3));

  const bookQueue = existingRes.filter((r) => r.bookId === input.bookId).length;
  const reservationRef = doc(collection(db, "organizations", orgId, "libraryReservations"));

  const reservation: LibraryReservation = {
    id: reservationRef.id,
    organizationId: orgId,
    bookId: input.bookId,
    bookTitle: book.title,
    memberType: input.memberType,
    memberId: input.memberId,
    memberName: member.name,
    reservedAt: now.toISOString(),
    expiresAt: expiresAtDate.toISOString(),
    queuePosition: bookQueue + 1,
    status: "Pending",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };

  await setDoc(reservationRef, reservation);

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "RESERVATION_CREATED",
    entityType: "LIBRARY_RESERVATION",
    entityId: reservationRef.id,
    metadata: { bookTitle: book.title, memberName: member.name, queuePosition: reservation.queuePosition },
  });

  return reservation;
};

export const cancelReservation = async (
  orgId: string,
  reservationId: string,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "libraryReservations", reservationId);
  await updateDoc(docRef, {
    status: "Cancelled",
    updatedAt: new Date().toISOString(),
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "RESERVATION_CANCELLED",
    entityType: "LIBRARY_RESERVATION",
    entityId: reservationId,
  });
};

// ----------------------------------------------------
// 7. FINES & WAIVERS
// ----------------------------------------------------

export const listFines = async (
  orgId: string,
  status?: string
): Promise<LibraryFine[]> => {
  const colRef = collection(db, "organizations", orgId, "libraryFines");
  const q = query(colRef, orderBy("createdAt", "desc"));
  const snap = await getDocs(q);
  let list = snap.docs.map((d) => d.data() as LibraryFine);

  if (status && status !== "ALL") {
    list = list.filter((f) => f.status === status);
  }

  return list;
};

export const payFine = async (
  orgId: string,
  fineId: string,
  paymentMethod: string,
  transactionReference: string | null,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "libraryFines", fineId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Paid",
    paidAt: now,
    paidBy: actor.uid,
    paidByName: actor.name,
    paymentMethod: paymentMethod || "Cash",
    transactionReference: transactionReference || null,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "FINE_PAID",
    entityType: "LIBRARY_FINE",
    entityId: fineId,
    metadata: { paymentMethod, transactionReference },
  });
};

export const waiveFine = async (
  orgId: string,
  input: WaiveFineInput,
  actor: { uid: string; name: string }
): Promise<void> => {
  const docRef = doc(db, "organizations", orgId, "libraryFines", input.fineId);
  const now = new Date().toISOString();

  await updateDoc(docRef, {
    status: "Waived",
    waivedAt: now,
    waivedBy: actor.uid,
    waivedByName: actor.name,
    waiverReason: input.reason,
    updatedAt: now,
  });

  await createAuditLog(orgId, {
    actorId: actor.uid,
    actorName: actor.name,
    action: "FINE_WAIVED",
    entityType: "LIBRARY_FINE",
    entityId: input.fineId,
    metadata: { reason: input.reason },
  });
};

// ----------------------------------------------------
// 8. LIBRARY DASHBOARD STATS
// ----------------------------------------------------

export const getLibraryDashboardStats = async (
  orgId: string
): Promise<LibraryDashboardStats> => {
  const [booksSnap, copiesSnap, issuedSnap, reservationsSnap, finesSnap] = await Promise.all([
    getDocs(collection(db, "organizations", orgId, "libraryBooks")),
    getDocs(collection(db, "organizations", orgId, "libraryBookCopies")),
    getDocs(
      query(
        collection(db, "organizations", orgId, "libraryTransactions"),
        where("status", "==", "Issued")
      )
    ),
    getDocs(
      query(
        collection(db, "organizations", orgId, "libraryReservations"),
        where("status", "==", "Pending")
      )
    ),
    getDocs(
      query(
        collection(db, "organizations", orgId, "libraryFines"),
        where("status", "==", "Pending")
      )
    ),
  ]);

  const totalBooks = booksSnap.size;
  const totalCopies = copiesSnap.size;
  const copies = copiesSnap.docs.map((d) => d.data() as LibraryBookCopy);
  const availableCopies = copies.filter((c) => c.status === "Available").length;
  const issuedCopies = issuedSnap.size;

  const todayStr = new Date().toISOString().split("T")[0];
  const issuedTransactions = issuedSnap.docs.map((d) => d.data() as LibraryTransaction);
  const overdueBooks = issuedTransactions.filter((t) => t.dueAt < todayStr).length;

  const reservedBooks = reservationsSnap.size;
  const pendingFines = finesSnap.docs.map((d) => d.data() as LibraryFine);
  const pendingFinesCount = pendingFines.length;
  const pendingFinesTotal = pendingFines.reduce((sum, f) => sum + (f.amount || 0), 0);

  return {
    totalBooks,
    totalCopies,
    availableCopies,
    issuedCopies,
    overdueBooks,
    reservedBooks,
    pendingFinesCount,
    pendingFinesTotal,
  };
};
