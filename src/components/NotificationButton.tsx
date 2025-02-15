const createNotification = async () => {
  const user = auth.currentUser;
  
  if (!user) {
    console.error('No authenticated user!');
    return;
  }

  try {
    const docRef = await addDoc(collection(db, 'notifications'), {
      message: 'New notification',
      userId: user.uid,
      read: false,
      createdAt: serverTimestamp()
    });
    console.log('Notification created with ID:', docRef.id);
  } catch (error) {
    console.error('Error creating notification:', error);
    if (error instanceof Error) {
      throw new Error(`Notification failed: ${error.message}`);
    }
  }
};