// import { useState, useEffect } from 'react';
// import { useParams, useNavigate } from 'react-router-dom';
// import { coursesAPI, usersAPI } from '../api/client';
// import { 
//   Plus, 
//   Users, 
//   Calendar, 
//   BookOpen, 
//   Filter, 
//   Search,
//   UserCheck,
//   MoreVertical,
//   Edit,
//   Trash2,
//   Eye
// } from 'lucide-react';

// export default function TeacherCoursesPage() {
//   const { teacherId } = useParams();
//   const navigate = useNavigate();
  
//   const [teacher, setTeacher] = useState(null);
//   const [courses, setCourses] = useState([]);
//   const [isLoading, setIsLoading] = useState(true);
//   const [search, setSearch] = useState('');
//   const [filter, setFilter] = useState('all');
//   const [showActions, setShowActions] = useState(null);

//   useEffect(() => {
//     if (teacherId) {
//       fetchTeacherData();
//       fetchTeacherCourses();
//     }
//   }, [teacherId]);

//   const fetchTeacherData = async () => {
//     try {
//       const response = await usersAPI.getById(teacherId);
//       setTeacher(response.data.data);
//     } catch (error) {
//       console.error('Error fetching teacher:', error);
//     }
//   };

//   const fetchTeacherCourses = async () => {
//     try {
//       setIsLoading(true);
//       const response = await coursesAPI.getByTeacher(teacherId);
//       setCourses(response.data.data);
//     } catch (error) {
//       console.error('Error fetching teacher courses:', error);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const filteredCourses = courses.filter(course => {
//     const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
//                          course.description?.toLowerCase().includes(search.toLowerCase());
    
//     const matchesFilter = filter === 'all' ||
//                          (filter === 'active' && course.status === 'ACTIVE') ||
//                          (filter === 'draft' && course.status === 'DRAFT') ||
//                          (filter === 'archived' && course.status === 'ARCHIVED');
    
//     return matchesSearch && matchesFilter;
//   });

//   const handleEditCourse = (courseId) => {
//     navigate(`/courses/${courseId}/edit`);
//   };

//   const handleViewCourse = (courseId) => {
//     navigate(`/courses/${courseId}`);
//   };

//   const handleManageStudents = (courseId) => {
//     navigate(`/courses/${courseId}/students`);
//   };

//   const handleDeleteCourse = async (courseId) => {
//     if (window.confirm('Вы уверены, что хотите удалить этот курс?')) {
//       try {
//         await coursesAPI.delete(courseId);
//         setCourses(courses.filter(c => c.id !== courseId));
//       } catch (error) {
//         console.error('Error deleting course:', error);
//       }
//     }
//   };

//   if (!teacherId) {
//     return (
//       <div className="text-center py-16">
//         <p className="text-gray-600">ID преподавателя не указан</p>
//       </div>
//     );
//   }

//   return (
//     <div className="space-y-6">
//       {/* Teacher Info Header */}
//       <div className="bg-white rounded-xl border border-gray-200 p-6">
//         <div className="flex items-center justify-between">
//           <div className="flex items-center gap-4">
//             <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xl font-bold">
//               {teacher?.name?.charAt(0) || 'T'}
//             </div>
//             <div>
//               <h1 className="text-2xl font-bold text-gray-900">
//                 Курсы преподавателя: {teacher?.name || 'Загрузка...'}
//               </h1>
//               <p className="text-gray-600">{teacher?.email}</p>
//               <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
//                 <span className="flex items-center gap-1">
//                   <BookOpen className="w-4 h-4" />
//                   {courses.length} курсов
//                 </span>
//                 <span className="flex items-center gap-1">
//                   <Users className="w-4 h-4" />
//                   {courses.reduce((acc, course) => acc + (course.studentsCount || 0), 0)} студентов
//                 </span>
//               </div>
//             </div>
//           </div>
          
//           <button 
//             onClick={() => navigate(`/users/${teacherId}`)}
//             className="btn btn-outline"
//           >
//             Профиль преподавателя
//           </button>
//         </div>
//       </div>

//       {/* Controls */}
//       <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
//         <div className="flex items-center gap-4">
//           <div className="relative">
//             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
//             <input
//               type="text"
//               placeholder="Поиск курсов..."
//               value={search}
//               onChange={(e) => setSearch(e.target.value)}
//               className="input pl-10 w-64"
//             />
//           </div>
          
//           <div className="flex items-center gap-2">
//             <Filter className="w-5 h-5 text-gray-400" />
//             <select 
//               value={filter}
//               onChange={(e) => setFilter(e.target.value)}
//               className="input py-2 pl-3 pr-8 appearance-none bg-white"
//             >
//               <option value="all">Все курсы</option>
//               <option value="active">Активные</option>
//               <option value="draft">Черновики</option>
//               <option value="archived">Архивные</option>
//             </select>
//           </div>
//         </div>

//         <button 
//           onClick={() => navigate('/courses/new')}
//           className="btn btn-primary flex items-center gap-2"
//         >
//           <Plus className="w-5 h-5" />
//           Добавить новый курс
//         </button>
//       </div>

//       {/* Courses List */}
//       {isLoading ? (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {[1, 2, 3].map(i => (
//             <div key={i} className="bg-white rounded-xl border border-gray-200 overflow-hidden animate-pulse">
//               <div className="h-40 bg-gray-200" />
//               <div className="p-5 space-y-3">
//                 <div className="h-4 bg-gray-200 rounded w-1/4" />
//                 <div className="h-6 bg-gray-200 rounded w-3/4" />
//                 <div className="h-4 bg-gray-200 rounded w-full" />
//                 <div className="h-10 bg-gray-200 rounded w-full mt-4" />
//               </div>
//             </div>
//           ))}
//         </div>
//       ) : filteredCourses.length === 0 ? (
//         <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
//           <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//           <h3 className="text-lg font-medium text-gray-900 mb-2">Курсы не найдены</h3>
//           <p className="text-gray-600 max-w-md mx-auto">
//             {search || filter !== 'all'
//               ? 'Попробуйте изменить параметры поиска'
//               : 'У этого преподавателя пока нет курсов'
//             }
//           </p>
//         </div>
//       ) : (
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {filteredCourses.map(course => (
//             <div key={course.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow">
//               {/* Course Image */}
//               <div className="h-48 relative">
//                 <img 
//                   src={course.image || '/api/placeholder/400/200'} 
//                   alt={course.title}
//                   className="w-full h-full object-cover"
//                 />
//                 <div className="absolute top-3 right-3">
//                   <div className="relative">
//                     <button 
//                       onClick={() => setShowActions(showActions === course.id ? null : course.id)}
//                       className="w-8 h-8 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white"
//                     >
//                       <MoreVertical className="w-4 h-4 text-gray-600" />
//                     </button>
                    
//                     {showActions === course.id && (
//                       <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg z-10 py-1">
//                         <button 
//                           onClick={() => {
//                             handleViewCourse(course.id);
//                             setShowActions(null);
//                           }}
//                           className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                         >
//                           <Eye className="w-4 h-4" />
//                           Просмотр
//                         </button>
//                         <button 
//                           onClick={() => {
//                             handleEditCourse(course.id);
//                             setShowActions(null);
//                           }}
//                           className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                         >
//                           <Edit className="w-4 h-4" />
//                           Редактировать
//                         </button>
//                         <button 
//                           onClick={() => {
//                             handleManageStudents(course.id);
//                             setShowActions(null);
//                           }}
//                           className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
//                         >
//                           <UserCheck className="w-4 h-4" />
//                           Студенты
//                         </button>
//                         <div className="border-t border-gray-100 my-1" />
//                         <button 
//                           onClick={() => {
//                             handleDeleteCourse(course.id);
//                             setShowActions(null);
//                           }}
//                           className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
//                         >
//                           <Trash2 className="w-4 h-4" />
//                           Удалить
//                         </button>
//                       </div>
//                     )}
//                   </div>
//                 </div>
                
//                 {/* Status Badge */}
//                 <div className="absolute top-3 left-3">
//                   <span className={`
//                     px-2 py-1 rounded-full text-xs font-medium
//                     ${course.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : ''}
//                     ${course.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' : ''}
//                     ${course.status === 'ARCHIVED' ? 'bg-gray-100 text-gray-800' : ''}
//                   `}>
//                     {course.status === 'ACTIVE' && 'Активный'}
//                     {course.status === 'DRAFT' && 'Черновик'}
//                     {course.status === 'ARCHIVED' && 'Архивный'}
//                   </span>
//                 </div>
//               </div>
              
//               {/* Course Info */}
//               <div className="p-5">
//                 <div className="flex items-center justify-between mb-2">
//                   <span className="text-sm font-medium text-primary bg-primary/10 px-2 py-1 rounded">
//                     {course.category}
//                   </span>
//                   <span className="text-sm text-gray-500">{course.level}</span>
//                 </div>
                
//                 <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-1">
//                   {course.title}
//                 </h3>
                
//                 <p className="text-gray-600 text-sm mb-4 line-clamp-2">
//                   {course.description}
//                 </p>
                
//                 {/* Stats */}
//                 <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
//                   <div className="flex items-center gap-3">
//                     <span className="flex items-center gap-1">
//                       <BookOpen className="w-4 h-4" />
//                       {course.lessonsCount || 0} уроков
//                     </span>
//                     <span className="flex items-center gap-1">
//                       <Users className="w-4 h-4" />
//                       {course.studentsCount || 0}
//                     </span>
//                   </div>
                  
//                   <span className="flex items-center gap-1">
//                     <Calendar className="w-4 h-4" />
//                     {new Date(course.createdAt).toLocaleDateString('ru-RU')}
//                   </span>
//                 </div>
                
//                 {/* Actions */}
//                 <div className="flex gap-2">
//                   <button 
//                     onClick={() => handleViewCourse(course.id)}
//                     className="flex-1 btn btn-outline"
//                   >
//                     Просмотреть
//                   </button>
//                   <button 
//                     onClick={() => handleManageStudents(course.id)}
//                     className="btn btn-primary"
//                   >
//                     <UserCheck className="w-4 h-4" />
//                   </button>
//                 </div>
//               </div>
//             </div>
//           ))}
//         </div>
//       )}

//       {/* Summary Stats */}
//       {!isLoading && courses.length > 0 && (
//         <div className="bg-white rounded-xl border border-gray-200 p-6">
//           <h2 className="text-lg font-bold text-gray-900 mb-4">Статистика по курсам</h2>
//           <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//             <div className="text-center p-4 bg-blue-50 rounded-lg">
//               <div className="text-2xl font-bold text-blue-700">{courses.length}</div>
//               <div className="text-sm text-blue-600">Всего курсов</div>
//             </div>
//             <div className="text-center p-4 bg-green-50 rounded-lg">
//               <div className="text-2xl font-bold text-green-700">
//                 {courses.filter(c => c.status === 'ACTIVE').length}
//               </div>
//               <div className="text-sm text-green-600">Активных</div>
//             </div>
//             <div className="text-center p-4 bg-yellow-50 rounded-lg">
//               <div className="text-2xl font-bold text-yellow-700">
//                 {courses.reduce((acc, c) => acc + (c.studentsCount || 0), 0)}
//               </div>
//               <div className="text-sm text-yellow-600">Всего студентов</div>
//             </div>
//             <div className="text-center p-4 bg-purple-50 rounded-lg">
//               <div className="text-2xl font-bold text-purple-700">
//                 {courses.filter(c => c.averageRating).length > 0 
//                   ? (courses.reduce((acc, c) => acc + (c.averageRating || 0), 0) / courses.filter(c => c.averageRating).length).toFixed(1)
//                   : '0.0'
//                 }
//               </div>
//               <div className="text-sm text-purple-600">Средний рейтинг</div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }