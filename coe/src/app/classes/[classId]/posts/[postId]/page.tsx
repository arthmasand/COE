'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import YourWorkBox from '../[postId]/YourWorkBox'; // Adjust path as per your project structure
import { ClimbingBoxLoader, HashLoader } from 'react-spinners';
import { toast } from 'react-toastify';

interface Material {
  id: string;
  title: string;
  titleSlug: string;
  type: string;
  link: string;
  status: string;
}

interface Post {
  id: string;
  title: string;
  description: string;
  content: string; // Assuming content is part of the post
  date: string;
  dueDate: string;
  materials: Material[];
}

interface User {
  _id: string;
}

const formatDate = (isoDate: string | null): string => {
  if (!isoDate) return '';

  const datePart = new Date(isoDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
  return datePart;
};

const PostPage = ({ params }: { params: { classId: string; postId: string } }) => {
  const [post, setPost] = useState<Post | null>(null);
  const [className, setClassName] = useState<string>('');
  const [submissionStatus, setSubmissionStatus] = useState<string>('Assigned');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [problemSubmissions, setProblemSubmissions] = useState<any[]>([]); // Add state for problem submissions

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch('http://localhost:5000/api/users/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log('User details fetched:', data);
        setUser(data);
      } catch (error) {
        console.error('Error fetching user details:', error);
        setUser(null);
      }
    };

    const fetchPostData = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No token found');
        }

        const response = await fetch(
          `http://localhost:5000/api/classes/${params.classId}/posts/${params.postId}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch post data');
        }

        const postData: Post = await response.json();
        const formattedPost: Post = {
          ...postData,
          date: formatDate(postData.date),
          dueDate: formatDate(postData.dueDate),
        };

        setPost(formattedPost);
        setClassName(postData.className);
      } catch (error) {
        console.error('Error fetching post data:', error);
        setError('Failed to fetch post data');
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
    fetchPostData();
  }, [params.classId, params.postId]);

  useEffect(() => {
    const fetchProblemSubmissions = async () => {
      if (!user) return;

      try {
        const response = await fetch(`http://localhost:5000/api/problemSubmission/${params.postId}/${user._id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch problem submissions');
        }
        const data = await response.json();
        setProblemSubmissions(data);
      } catch (error) {
        console.error('Error fetching problem submissions:', error);
        setProblemSubmissions([]);
      }
    };

    fetchProblemSubmissions();
  }, [user, params.postId]);

  const handleSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No token found');
      }

      // Step 3: Submit the data to your backend
      const response = await fetch(
        `http://localhost:5000/api/postSubmissions/submit`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: user?._id,
            classId: params.classId,
            postId: params.postId,
            problemSubmissions: problemSubmissions.map(submission => submission._id), // Pass fetched IDs dynamically
          }),
        }
      );

      if (response.ok) {
        setSubmissionStatus('Submitted');
        alert('Post submitted successfully');
      } else {
        console.error('Failed to submit post');
        toast.error('Failed to submit post');
      }
    } catch (error) {
      console.error('Error submitting post:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <HashLoader color="#fc03c2" loading={loading} size={40} aria-label="Loading Spinner" data-testid="loader" />
      </div>
    );
  }

  if (!post) {
    return (
    <div className="flex justify-center items-center h-screen">
      <HashLoader  color="#fc03c2" loading={loading} size={40} aria-label="Loading Spinner" data-testid="loader" />
    </div>)
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const handleMenuItemClick = (itemId: string) => {};

  const isDueDatePassed = new Date(post.dueDate) < new Date();

  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pdf':
        return '/icons/pdf.svg';
      case 'word':
        return '/icons/word.svg';
      default:
        return '/icons/default.svg';
    }
  };

  const checkMaterialStatus = (titleSlug: string) => {
    const submission = problemSubmissions.find(submission => submission.problemId === titleSlug);
    return submission ? submission.status === 'submitted' : false;
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex flex-1" style={{ marginTop: '56px' }}>
        <Sidebar onItemClick={handleMenuItemClick} />
        <div className="flex-1 p-4 bg-gray-100 overflow-y-auto flex">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6 w-2/3 mr-4">
            <h2 className="text-2xl font-bold mb-2">{post.title}</h2>
            <p className="text-gray-700 mb-4">{post.date}</p>
            <p className="text-gray-700 mb-4">{post.description}</p>
            <div className="text-gray-700 mb-4">
              <strong>Due Date: </strong>
              {post.dueDate}
            </div>
            <div className="text-gray-700 mb-4">
              <strong>Materials: </strong>
              <div className="grid grid-cols-1 gap-4">
                {post.materials.map((material, index) => (
                  <div
                    key={index}
                    className="bg-white rounded-lg shadow-md p-4 mb-4"
                  >
                    <h3 className="text-xl font-semibold mb-2">
                      {material.title}
                    </h3>
                    <div className="flex justify-between items-center">
                      <Link
                        href={`/problems/${material.titleSlug}?postId=${params.postId}`}
                        className="text-blue-500 hover:underline"
                      >
                        View
                      </Link>
                      <span className="text-sm text-gray-500">
                        {checkMaterialStatus(material.titleSlug) ? (
                          <span className="text-green-500">&#10003; Solved</span>
                        ) : (
                          <span className="text-red-500">&#10007; Not Solved</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button
              onClick={handleSubmit}
              className="bg-blue-500 text-white p-2 rounded"
              disabled={submissionStatus === 'Submitted'}
            >
              Submit
            </button>
          </div>
          <YourWorkBox
            isDueDatePassed={isDueDatePassed}
            submissionStatus={submissionStatus}
            setSubmissionStatus={setSubmissionStatus}
            classId={params.classId}
            postId={params.postId}
          />
        </div>
      </div>
    </div>
  );
};

export default PostPage;
