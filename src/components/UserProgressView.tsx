import React, { useState, useEffect } from 'react';
import { getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

interface UserProgressProps {
  userId: string;
}

export function UserProgressView({ userId }: UserProgressProps) {
  const [progress, setProgress] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      const userDoc = await getDoc(doc(db, "users", userId));
      if (userDoc.exists()) {
        setProgress(userDoc.data().progress || {});
      }
      setLoading(false);
    };
    
    fetchProgress();
  }, [userId]);

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Tutorial Progress</h3>
      {/* Progress visualization */}
    </div>
  );
} 