// src/hooks/usePagination.ts - Hook pour la pagination
export function usePagination<T>(
  fetchFunction: (params: any) => Promise<{ count: number; results: T[] }>,
  pageSize: number = 20
) {
  const [data, setData] = useState<T[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPage = async (page: number, additionalParams: any = {}) => {
    setLoading(true)
    setError(null)
    
    try {
      const offset = (page - 1) * pageSize
      const response = await fetchFunction({
        limit: pageSize,
        offset,
        ...additionalParams
      })
      
      setData(response.results)
      setTotalCount(response.count)
      setCurrentPage(page)
    } catch (error) {
      let errorMessage = 'Une erreur est survenue'
      if (error instanceof ApiError) {
        errorMessage = error.message
      }
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  return {
    data,
    totalCount,
    currentPage,
    totalPages,
    loading,
    error,
    fetchPage,
    hasNextPage: currentPage < totalPages,
    hasPreviousPage: currentPage > 1
  }
}