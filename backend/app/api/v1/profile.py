from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.core.database import get_db
from app.core.security import get_current_user, AuthenticatedUser
from app.models.user import Profile, AcademicProfile
from app.schemas.user import ProfileRead, ProfileUpdate, AcademicProfileRead, AcademicProfileUpdate, OnboardingSubmit

router = APIRouter()

@router.get("", response_model=ProfileRead)
@router.get("/", response_model=ProfileRead)
@router.get("/me", response_model=ProfileRead)
async def get_my_profile(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await db.get(Profile, user.id)
    if not profile:
        # Auto-create if not yet created by Supabase webhook
        profile = Profile(
            id=user.id,
            full_name="Student",
            avatar_url=None
        )
        db.add(profile)
        await db.commit()
        await db.refresh(profile)
    return profile

@router.put("/me", response_model=ProfileRead)
async def update_my_profile(
    payload: ProfileUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    profile = await db.get(Profile, user.id)
    if not profile:
        profile = Profile(id=user.id, full_name=payload.full_name or "Student")
        db.add(profile)

    if payload.full_name is not None:
        profile.full_name = payload.full_name
    if payload.avatar_url is not None:
        profile.avatar_url = payload.avatar_url

    await db.commit()
    await db.refresh(profile)
    return profile

@router.get("/academic-profile", response_model=AcademicProfileRead)
async def get_academic_profile(
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AcademicProfile).where(AcademicProfile.user_id == user.id)
    res = await db.execute(stmt)
    academic_profile = res.scalar_one_or_none()
    if not academic_profile:
        academic_profile = AcademicProfile(user_id=user.id)
        db.add(academic_profile)
        await db.commit()
        await db.refresh(academic_profile)
    return academic_profile

@router.put("/academic-profile", response_model=AcademicProfileRead)
async def update_academic_profile(
    payload: AcademicProfileUpdate,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AcademicProfile).where(AcademicProfile.user_id == user.id)
    res = await db.execute(stmt)
    academic_profile = res.scalar_one_or_none()
    if not academic_profile:
        academic_profile = AcademicProfile(user_id=user.id)
        db.add(academic_profile)

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(academic_profile, field, value)

    await db.commit()
    await db.refresh(academic_profile)
    return academic_profile

@router.post("/onboarding", response_model=AcademicProfileRead)
async def submit_onboarding(
    payload: OnboardingSubmit,
    user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    stmt = select(AcademicProfile).where(AcademicProfile.user_id == user.id)
    res = await db.execute(stmt)
    academic_profile = res.scalar_one_or_none()
    if not academic_profile:
        academic_profile = AcademicProfile(user_id=user.id)
        db.add(academic_profile)

    academic_profile.education_level = payload.education_level
    academic_profile.college_university = payload.college_university
    academic_profile.course = payload.course
    academic_profile.semester = payload.semester
    academic_profile.daily_available_hours = payload.daily_available_hours
    academic_profile.preferred_study_hours_start = payload.preferred_study_hours_start
    academic_profile.preferred_study_hours_end = payload.preferred_study_hours_end
    academic_profile.break_duration_minutes = payload.break_duration_minutes
    academic_profile.goals = payload.goals
    academic_profile.onboarding_completed = True

    # Optionally seed initial subjects if provided in onboarding
    from app.models.subject import Subject
    if payload.subjects:
        for s in payload.subjects:
            subj = Subject(
                user_id=user.id,
                name=s.get("name", "New Subject"),
                code=s.get("code"),
                color=s.get("color", "#3B82F6"),
                target_grade=s.get("target_grade", "A")
            )
            db.add(subj)

    await db.commit()
    await db.refresh(academic_profile)
    return academic_profile
