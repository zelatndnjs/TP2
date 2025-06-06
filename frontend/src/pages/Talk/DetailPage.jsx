import axios from "../../api/axioInstance";
import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { HalfButton, HalfRedButton } from "../../components/common/Button";
import ChatComponent from "../../components/chat/ChatComponent";
import styled from "styled-components";
import Popup from "../../components/common/Popup";

const Container = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 3rem;
  color: white;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
`;

const TopBar = styled.div`
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
  border-radius: 8px;
`;

const BackButton = styled.button`
  background: none;
  border: 0.6px solid;
  color: #c4c4c4;
  font-size: 0.9rem;
  cursor: pointer;
  padding: 0.5rem 1rem;
  border-radius: 4px;

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const Title = styled.div`
  width: 80%;
  padding: 12px 0;
  color: white;
  font-size: 1.4rem;
`;

const Section = styled.div`
  display: flex;
  align-content: center;
  flex-direction: column;
  margin-bottom: 1.5rem;
  flex: 1;
`;

const RowSection = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: space-between;
  align-items: start;
  flex: 1;
`;

const ColSection = styled.div`
  display: grid;
  align-items: center;
  width: 76%;
`;

const Label = styled.div`
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: #c4c4c4;
`;

const Value = styled.div`
  padding: 12px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const TextValue = styled.div`
  padding: 12px;
  min-height: 200px;
  background-color: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
`;

const LoadingContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  color: white;
  font-size: 1.2rem;
`;

const ErrorContainer = styled.div`
  text-align: center;
  padding: 2rem;
  color: #ff4444;
`;

export default function DetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const token = localStorage.getItem("token");

  const handleJoin = async () => {
    try {
      if (!token) {
        alert("로그인이 필요한 서비스입니다.");
        return;
      }
      await axios.post(`/meetings/${post.id}/join`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("참여 요청이 성공적으로 전송되었습니다!");
      setShowConfirm(false);
    } catch (error) {
      alert(error.response?.data?.error || "서버와의 통신 중 오류가 발생했습니다.");
      setShowConfirm(false);
    }
  };

  function getUserIdFromToken() {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.sub;
    } catch {
      return null;
    }
  }

  const userId = getUserIdFromToken();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        setLoading(true);
        if (isNaN(id)) {
          navigate("/not-found", { replace: true });
          return;
        }
        const res = await axios.get(`/meetings/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.data) {
          navigate("/not-found", { replace: true });
        }
        setPost(res.data);
      } catch (err) {
        if (err.response?.status === 404) navigate("/not-found", { replace: true });
        else setError("게시글을 불러오는데 실패했습니다.");
      } finally {
        setLoading(false);
      }
    };
    fetchPost();
  }, [id, navigate]);

  if (loading) {
    return (
      <Container>
        <LoadingContainer>게시글을 불러오는 중...</LoadingContainer>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <ErrorContainer>
          <div>{error}</div>
          <BackButton onClick={() => navigate("/talk")} style={{ marginTop: "1rem" }}>돌아가기</BackButton>
        </ErrorContainer>
      </Container>
    );
  }

  if (!post && !loading && !error) {
    navigate("/not-found", { replace: true });
    return null;
  }

  return (
    <Container>
      {post && (
        <>
          <TopBar>
            <Title>{post.title}</Title>
            <BackButton onClick={() => navigate(-1)}>돌아가기</BackButton>
          </TopBar>

          <RowSection>
            <ColSection>
              <Section><Label>책 제목</Label><Value>{post.bookTitle}</Value></Section>
              <Section><Label>작가</Label><Value>{post.bookAuthor}</Value></Section>
              <Section><Label>책 카테고리</Label><Value>{post.bookCategory}</Value></Section>
            </ColSection>
            <Section>
              {post.bookCover ? <img src={post.bookCover} alt="book cover" style={{ width: "100%", borderRadius: "8px" }} /> : <div></div>}
            </Section>
          </RowSection>

          <RowSection>
            <Section><Label>모임 시작일</Label><Value>{post.startDate?.slice(0, 10)}</Value></Section>
            <Section><Label>모집 인원</Label><Value>{(post.participants?.length || 0)} / {post.maxMembers} 명</Value></Section>
          </RowSection>

          <Section><Label>모임 소개</Label><TextValue>{post.description}</TextValue></Section>

          <div>
            {userId && userId === post.hostEmail ? (
              <div style={{ display: "flex", gap: "1rem", marginBottom: "1.5rem" }}>
                <HalfButton onClick={() => navigate(`/talk/meeting/edit/${post.id}`)}>수정하기</HalfButton>
                <HalfRedButton
                  onClick={async () => {
                    if (window.confirm("정말 삭제하시겠습니까?")) {
                      try {
                        await axios.delete(`/meetings/${post.id}`, { headers: { Authorization: `Bearer ${token}` } });
                        alert("삭제되었습니다.");
                        navigate(-1);
                      } catch {
                        alert("삭제에 실패했습니다.");
                      }
                    }
                  }}
                >삭제하기</HalfRedButton>
              </div>
            ) : (
              <center>
                {post.active === false || (post.participants?.length || 0) === post.maxMembers ? (
                  <HalfRedButton>모집 마감</HalfRedButton>
                ) : (
                  <>
                    <HalfButton onClick={() => setShowConfirm(true)}>참여하기</HalfButton>
                    {showConfirm && (
                      <Popup
                        MainText="참여 요청을 보내시겠습니까?"
                        SubText="호스트의 수락 후 참여가 확정됩니다."
                        onConfirm={handleJoin}
                        onCancel={() => setShowConfirm(false)}
                      />
                    )}
                  </>
                )}
              </center>
            )}
          </div>
        </>
      )}
    </Container>
  );
}