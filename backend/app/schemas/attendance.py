from datetime import date, datetime, time
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

AttendanceStatus = Literal["present", "half_day", "absent", "leave"]


class AttendanceSpan(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    in_time: time
    out_time: time | None = None

    @model_validator(mode="after")
    def out_after_in(self) -> "AttendanceSpan":
        if self.out_time is not None and self.out_time <= self.in_time:
            raise ValueError("Out time must be after in time")
        return self


def absent_cannot_have_times(status: AttendanceStatus | None, spans: list[AttendanceSpan] | None) -> None:
    if status == "absent" and spans:
        raise ValueError("An absent employee cannot have in or out times")


def order_spans(spans: list[AttendanceSpan]) -> list[AttendanceSpan]:
    ordered = sorted(spans, key=lambda span: span.in_time)
    seen: set[time] = set()
    previous_end: time | None = None
    for span in ordered:
        if span.in_time in seen:
            raise ValueError("Each in time can be used once")
        seen.add(span.in_time)
        if previous_end is not None and span.in_time < previous_end:
            raise ValueError("In and out times overlap")
        previous_end = span.out_time if span.out_time is not None else span.in_time
    return ordered


class AttendanceCreate(BaseModel):
    employee_id: UUID
    work_date: date
    status: AttendanceStatus
    spans: list[AttendanceSpan] = Field(default_factory=list, max_length=24)

    @field_validator("spans")
    @classmethod
    def spans_do_not_overlap(cls, spans: list[AttendanceSpan]) -> list[AttendanceSpan]:
        return order_spans(spans)

    @model_validator(mode="after")
    def no_times_when_absent(self) -> "AttendanceCreate":
        absent_cannot_have_times(self.status, self.spans)
        return self


class AttendanceUpdate(BaseModel):
    employee_id: UUID | None = None
    work_date: date | None = None
    status: AttendanceStatus | None = None
    spans: list[AttendanceSpan] | None = Field(default=None, max_length=24)

    @field_validator("spans")
    @classmethod
    def spans_do_not_overlap(cls, spans: list[AttendanceSpan] | None) -> list[AttendanceSpan] | None:
        if spans is None:
            return None
        return order_spans(spans)

    @model_validator(mode="after")
    def no_times_when_absent(self) -> "AttendanceUpdate":
        absent_cannot_have_times(self.status, self.spans)
        return self


class AttendanceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: UUID
    employee_id: UUID
    employee_name: str
    work_date: date
    status: AttendanceStatus
    spans: list[AttendanceSpan]
    created_at: datetime
    updated_at: datetime
    created_by: UUID | None
    updated_by: UUID | None


class AttendanceMark(BaseModel):
    employee_id: UUID
    status: AttendanceStatus
    spans: list[AttendanceSpan] = Field(default_factory=list, max_length=24)

    @field_validator("spans")
    @classmethod
    def spans_do_not_overlap(cls, spans: list[AttendanceSpan]) -> list[AttendanceSpan]:
        return order_spans(spans)

    @model_validator(mode="after")
    def no_times_when_absent(self) -> "AttendanceMark":
        absent_cannot_have_times(self.status, self.spans)
        return self


class AttendanceDaySave(BaseModel):
    work_date: date
    marks: list[AttendanceMark] = Field(min_length=1, max_length=500)


class AttendanceRosterItem(BaseModel):
    employee_id: UUID
    employee_name: str
    status: AttendanceStatus | None
    spans: list[AttendanceSpan]


class AttendanceRoster(BaseModel):
    work_date: date
    items: list[AttendanceRosterItem]


class AttendanceRangeDay(BaseModel):
    work_date: date
    status: AttendanceStatus
    spans: list[AttendanceSpan]


class AttendanceRangeItem(BaseModel):
    employee_id: UUID
    employee_name: str
    days: list[AttendanceRangeDay]


class AttendanceRange(BaseModel):
    start: date
    end: date
    items: list[AttendanceRangeItem]
