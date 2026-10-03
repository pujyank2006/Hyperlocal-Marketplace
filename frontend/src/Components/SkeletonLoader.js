import styles from '../ComponentStyles/skeleton.module.css';

export function ListingSkeleton() {
  return (
    <div className={styles.skeletonCard}>
      <div className={styles.skeletonImg} />
      <div className={styles.skeletonBody}>
        <div className={`${styles.skeletonLine} ${styles.lineTitle}`} />
        <div className={`${styles.skeletonLine} ${styles.linePrice}`} />
        <div className={`${styles.skeletonLine} ${styles.lineLoc}`} />
      </div>
    </div>
  );
}

export function SkeletonGrid({ count = 6 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <ListingSkeleton key={idx} />
      ))}
    </>
  );
}
