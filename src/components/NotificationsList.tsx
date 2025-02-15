import React, { useEffect, useState } from 'react';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { auth, db } from '../firebase';

const NotificationsList = () => {
  const [notifications, loading] = useCollectionData(
    query(
      collection(db, 'notifications'),
      orderBy('createdAt', 'desc')
    )
  );

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      {notifications?.map(notification => (
        <div key={notification.id} className="p-2 border-b">
          <h3 className="font-medium">{notification.title}</h3>
          <p>{notification.message}</p>
        </div>
      ))}
    </div>
  );
};

export default NotificationsList; 