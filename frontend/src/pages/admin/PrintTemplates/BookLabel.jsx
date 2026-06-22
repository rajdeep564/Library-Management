import BookLabel from "../../../components/BookLabel";

export default function BookLabelTemplate({ book, qrData }) {
  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .book-label-print, .book-label-print * { visibility: visible; }
          .book-label-print { position: absolute; left: 0; top: 0; }
        }
      `}</style>
      <div className="book-label-print">
        <BookLabel book={book} qrData={qrData} />
      </div>
    </div>
  );
}
